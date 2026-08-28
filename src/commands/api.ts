import * as p from "@clack/prompts";
import type { Command } from "commander";
import { resolveCredential } from "../auth/resolve.js";
import { UsageError } from "../lib/errors.js";
import {
  executeOperation,
  executeOperationStream,
  executeRawRequest,
  parseBodyInput,
  parseParameterAssignments,
} from "../lib/http.js";
import { getOperation, operationsByTag } from "../lib/operations.js";
import { writeResult, writeStreamEvent } from "../lib/output.js";
import {
  readRegisteredOptions,
  registerBodyOptions,
  registerParameterOptions,
} from "../lib/schema-options.js";
import type { OperationDefinition } from "../lib/types.js";
import { contextFrom } from "./context.js";

interface GeneratedOptions {
  param?: string[];
  body?: string;
  yes?: boolean;
}

export function registerApiCommands(program: Command): void {
  const api = program
    .command("api")
    .description("Invoke generated commands for every customer-facing AskNews API operation")
    .addHelpText(
      "after",
      `
DISCOVERY
  asknews api list                         List all operations
  asknews api list --tag news              Filter by API group
  asknews api list --output json           Machine-readable operation catalog
  asknews api <group> --help               List operations in one group
  asknews api <group> <operation> --help   Show every parameter and safety rule

PARAMETERS
  Every schema parameter is an explicit kebab-case option:
    --start-timestamp  --n-articles  --historical
  Array options can be JSON or repeated:
    --domains='["reuters.com","apnews.com"]'
    --domains=reuters.com --domains=apnews.com
  --param name=value remains available as an escape hatch.

REQUEST BODIES
  Body fields are explicit kebab-case options when a schema is available.
  --body '{"query":"example"}'             Inline JSON
  --body @request.json                     Read JSON from a file
  Direct body-field options override values supplied through --body.

SAFETY
  State-changing commands require --yes in noninteractive sessions.
  High-cost operations are labeled in command help and the operation catalog.
`,
    );

  api
    .command("list")
    .description("List generated operations and their parameters")
    .option("--tag <tag>", "filter by API group")
    .option("--safety <level>", "filter by read-only, high-cost, or mutating")
    .action((options: { tag?: string; safety?: string }, command) => {
      const { writer } = contextFrom(command);
      const operations = [...operationsByTag().values()]
        .flat()
        .filter((operation) => !options.tag || operation.tag === options.tag)
        .filter((operation) => !options.safety || operation.safety === options.safety)
        .map((operation) => ({
          command: `asknews api ${operation.tag} ${operation.command}`,
          operationId: operation.operationId,
          method: operation.method,
          path: operation.path,
          safety: operation.safety,
          summary: operation.summary,
          parameters: operation.parameters,
          requestBody: operation.requestBody,
        }));
      writeResult(writer, operations);
    });

  for (const [tag, operations] of operationsByTag()) {
    const group = api.command(tag).description(`Generated ${tag} API operations`);
    for (const operation of operations) {
      registerOperation(group, operation);
    }
  }

  program
    .command("request")
    .description("Make an authenticated request to an API path")
    .argument("<method>", "HTTP method")
    .argument("<path>", "path relative to the configured /v1 base URL")
    .option("--body <json-or-file>", "JSON body or @file.json")
    .action(async (method: string, path: string, options: { body?: string }, command) => {
      const { config, writer } = contextFrom(command);
      const credential = await resolveCredential(config);
      const body = await parseBodyInput(options.body);
      const response = await executeRawRequest(
        config,
        credential.token,
        method.toUpperCase(),
        path,
        body,
        credential.refresh,
      );
      writeResult(writer, response.data);
    });
}

export async function invokeOperation(
  command: Command,
  operationId: string,
  parameters: Record<string, unknown>,
  body?: unknown,
  transform?: (data: unknown) => unknown,
): Promise<unknown> {
  const { config, writer } = contextFrom(command);
  const credential = await resolveCredential(config);
  const response = await executeOperation(
    config,
    credential.token,
    getOperation(operationId),
    { parameters, body },
    credential.refresh,
  );
  const data = transform ? transform(response.data) : response.data;
  writeResult(writer, data);
  return data;
}

function registerOperation(group: Command, operation: OperationDefinition): void {
  const command = group
    .command(operation.command)
    .description(operation.summary || operation.operationId)
    .option(
      "-p, --param <name=value>",
      "operation parameter; repeat for arrays or multiple values",
      collect,
      [],
    );
  const registeredParameters = registerParameterOptions(command, operation);
  const registeredBody = registerBodyOptions(command, operation);
  if (operation.requestBody) {
    command.option("--body <json-or-file>", "JSON request body or @file.json");
  }
  if (operation.safety === "mutating") {
    command.option("-y, --yes", "confirm this state-changing operation");
  }
  command
    .addHelpText("after", formatOperationHelp(operation))
    .action(async (options: GeneratedOptions, command) => {
      await confirmMutation(operation, Boolean(options.yes));
      const parameters = parseParameterAssignments(options.param);
      Object.assign(parameters, readRegisteredOptions(command, registeredParameters));
      const bodyInput = await parseBodyInput(options.body);
      const bodyOptions = readRegisteredOptions(command, registeredBody);
      const body =
        Object.keys(bodyOptions).length === 0
          ? bodyInput
          : { ...(isRecord(bodyInput) ? bodyInput : {}), ...bodyOptions };
      if (isRecord(body) && body.stream === true) {
        await invokeStreamingOperation(command, operation.operationId, parameters, body);
        return;
      }
      await invokeOperation(command, operation.operationId, parameters, body);
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function confirmMutation(
  operation: OperationDefinition,
  confirmed: boolean,
): Promise<void> {
  if (operation.safety !== "mutating" || confirmed) {
    return;
  }
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    throw new UsageError(
      `${operation.operationId} changes server state; rerun with --yes to confirm`,
    );
  }
  const answer = await p.confirm({
    message: `${operation.summary} (${operation.method} ${operation.path})?`,
    initialValue: false,
  });
  if (p.isCancel(answer) || !answer) {
    throw new UsageError("Operation cancelled");
  }
}

export async function invokeStreamingOperation(
  command: Command,
  operationId: string,
  parameters: Record<string, unknown>,
  body: Record<string, unknown>,
): Promise<void> {
  const { config, writer } = contextFrom(command);
  if (!["human", "jsonl"].includes(writer.format)) {
    throw new UsageError("--stream supports --output human or --output jsonl");
  }
  const credential = await resolveCredential(config);
  let wroteHumanText = false;
  await executeOperationStream(
    config,
    credential.token,
    getOperation(operationId),
    { parameters, body },
    (event) => {
      wroteHumanText = writeStreamEvent(writer, event) || wroteHumanText;
    },
    credential.refresh,
  );
  if (writer.format === "human" && wroteHumanText) writer.stdout.write("\n");
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function parameterOptionName(name: string): string {
  return name.replaceAll("_", "-");
}

export function formatOperationHelp(operation: OperationDefinition): string {
  const safety =
    operation.safety === "mutating"
      ? "Changes server state. Interactive confirmation or --yes is required."
      : operation.safety === "high-cost"
        ? "Read-only but potentially billable/high-cost. Keep limits narrow."
        : "Read-only.";
  const firstParameter = operation.parameters[0];
  const parameterExample = firstParameter
    ? ` --${parameterOptionName(firstParameter.name)} <value>`
    : "";
  return `
OPERATION
  ID:      ${operation.operationId}
  Request: ${operation.method} ${operation.path}
  Safety:  ${operation.safety} — ${safety}

EXAMPLES
  asknews api ${operation.tag} ${operation.command} --help
  asknews api ${operation.tag} ${operation.command}${parameterExample} --output json
  asknews api ${operation.tag} ${operation.command} --param name=value --output json
${operation.requestBody ? `  asknews api ${operation.tag} ${operation.command} --body @request.json --output json\n` : ""}
GLOBAL OPTIONS
  --output human|table|json|jsonl|yaml   Result format
  --json                           Shortcut for --output json
  --api-key <key>                  Credential for this invocation
  --api-url <url>                  Override the API base URL
  --timeout <milliseconds>         Request timeout (streams: inactivity limit)
  --no-color                       Disable ANSI color
`;
}
