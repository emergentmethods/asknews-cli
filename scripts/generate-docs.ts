import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import type { Argument, Command, Option } from "commander";
import packageJson from "../package.json" with { type: "json" };
import { buildCli } from "../src/cli.js";
import manifestJson from "../src/generated/operations.json" with { type: "json" };
import type {
  OperationDefinition,
  OperationManifest,
  OperationParameter,
} from "../src/lib/types.js";
import { escapeMdx } from "./mdx.js";

const manifest = manifestJson as OperationManifest;
const program = buildCli();
const commandDocsRoot = resolve("docs/commands");
const commandRoutesRoot = join(commandDocsRoot, "routes");
const skillCommandRoot = resolve("skills/asknews-cli/references/commands");
const siteOutput = process.env.ASKNEWS_DOCS_OUTPUT_DIR
  ? resolve(process.env.ASKNEWS_DOCS_OUTPUT_DIR)
  : undefined;
const publicSkillOutput = process.env.ASKNEWS_SKILL_PUBLIC_DIR
  ? resolve(process.env.ASKNEWS_SKILL_PUBLIC_DIR)
  : undefined;
// The docs site renders the command-reference pages through MDX, so that output must escape the
// characters MDX would treat as JSX (`<`, `{`, `}`) everywhere except code spans and fenced blocks.
// In-repo `docs/` pages and every Agent Skill file (including the published `.well-known` copy) stay
// raw, because GitHub and skill-consuming agents read plain Markdown, not MDX.
const escapeSiteMarkdown = process.env.ASKNEWS_DOCS_MDX_ESCAPE === "1";

const examples: Record<string, string[]> = {
  "asknews auth login": ["asknews auth login", "asknews auth login --no-browser"],
  "asknews auth status": ["asknews auth status --output json"],
  "asknews news search": [
    'asknews news search "latest AI policy" --limit 5',
    'asknews news search "chip export controls" --categories Technology --hours-back 48 --output json',
  ],
  "asknews news get": ["asknews news get ARTICLE_ID --output json"],
  "asknews stories list": [
    'asknews stories list --query "European elections" --limit 5 --output json',
  ],
  "asknews stories get": ["asknews stories get STORY_ID --output json"],
  "asknews research": [
    'asknews research "Compare current AI regulation proposals" --output json',
    'asknews research "Summarize policy reactions" --stream true --output jsonl',
  ],
  "asknews research models": ["asknews research models --output json"],
  "asknews web": ['asknews web "recent central bank statements" --output json'],
  "asknews reddit": ['asknews reddit "consumer reactions" --output json'],
  "asknews wiki": ['asknews wiki "semiconductor lithography" --output json'],
  "asknews x": [
    'asknews x "from:elonmusk min_faves:100 -filter:replies" --lookback 24 --output json',
    'asknews x "(bitcoin OR ethereum) AND (crash OR rally)" --start-datetime 2026-01-01T00:00:00Z --end-datetime 2026-01-31T00:00:00Z --output json',
  ],
  "asknews alerts list": ["asknews alerts list --output json"],
  "asknews api list": [
    "asknews api list --output json",
    "asknews api list --tag news --safety read-only --output json",
  ],
  "asknews request": ["asknews request GET /profiles/me --output json"],
  "asknews cli setup": [
    "asknews cli setup --scope global",
    "asknews cli setup --scope project --directory .",
  ],
};

// Extra prose appended to a command's section after its examples.
const notes: Record<string, string[]> = {
  "asknews research": [
    "DeepNews research can run for several minutes; how long depends on the query, the sources",
    "involved, and the search depth. Streaming is the default (`--stream true`) whenever the",
    "output format supports it (`human` or `jsonl`): results render as they arrive and the",
    "request timeout only bounds inactivity between events, not total duration. With",
    "`--stream false` or a non-streaming output format (`json`, `table`, `yaml`) the full",
    "response arrives only when research completes, so the timeout must cover the whole run —",
    "it defaults to 900000 ms (15 minutes) for this command. Raise `--timeout` for especially",
    "deep multi-source runs.",
  ],
};

const routePages = new Map<string, string>();
for (const route of program.commands.filter((command) => command.name() !== "api")) {
  routePages.set(route.name(), renderCommanderRoute(route));
}
routePages.set("api", renderApiOverview());
for (const tag of [...new Set(manifest.operations.map((operation) => operation.tag))]) {
  routePages.set(
    `api-${tag}`,
    renderApiTag(
      tag,
      manifest.operations.filter((operation) => operation.tag === tag),
    ),
  );
}

await resetDirectory(commandRoutesRoot);
await resetDirectory(skillCommandRoot);
if (siteOutput) await resetDirectory(siteOutput);

const index = renderCommandIndex(routePages);
await mkdir(commandDocsRoot, { recursive: true });
await writeFile(join(commandDocsRoot, "README.md"), index, "utf8");
await writeFile(join(skillCommandRoot, "index.md"), stripFrontmatter(index), "utf8");

for (const [name, content] of routePages) {
  await writeFile(join(commandRoutesRoot, `${name}.md`), content, "utf8");
  await writeFile(join(skillCommandRoot, `${name}.md`), stripFrontmatter(content), "utf8");
}

if (siteOutput) {
  await writeFile(join(siteOutput, "index.md"), forExternal(index), "utf8");
  for (const [name, content] of routePages) {
    await writeFile(join(siteOutput, `${name}.md`), forExternal(content), "utf8");
  }
  await writeFile(
    join(siteOutput, "nav.json"),
    `${JSON.stringify(
      [...routePages.entries()].map(([slug, content]) => ({
        slug,
        title: frontmatterTitle(content),
      })),
      null,
      2,
    )}\n`,
    "utf8",
  );
}

if (publicSkillOutput) {
  await rm(publicSkillOutput, { recursive: true, force: true });
  await mkdir(publicSkillOutput, { recursive: true });
  await cp(resolve("skills/asknews-cli"), publicSkillOutput, { recursive: true });
  const files = await listRelativeFiles(publicSkillOutput);
  const discoveryRoot = resolve(publicSkillOutput, "..");
  await mkdir(discoveryRoot, { recursive: true });
  await writeFile(
    join(discoveryRoot, "index.json"),
    `${JSON.stringify(
      {
        skills: [
          {
            name: "asknews-cli",
            description:
              "Use the AskNews CLI for sourced news retrieval, story tracking, DeepNews research, public API operations, and safe AskNews automation.",
            files,
          },
        ],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

process.stdout.write(
  `Generated ${routePages.size} command reference pages from AskNews API ${manifest.schemaVersion}\n`,
);

function renderCommandIndex(pages: Map<string, string>): string {
  const rows = [...pages.entries()]
    .filter(([slug]) => !slug.startsWith("api-"))
    .map(
      ([slug, content]) =>
        `| [\`${slug}\`](commands/${slug}) | ${frontmatterDescription(content)} |`,
    );
  return [
    "---",
    "title: CLI command reference",
    "description: Complete generated reference for AskNews CLI commands",
    "---",
    "",
    "# CLI command reference",
    "",
    `Generated from AskNews CLI ${packageJson.version} and AskNews API ${manifest.schemaVersion}.`,
    "",
    "The installed CLI is authoritative. Run `asknews <command> --help` for the exact options in",
    "your version. Regenerate these pages with `pnpm sync:openapi`.",
    "",
    "| Command | Description |",
    "| --- | --- |",
    ...rows,
    "",
    "## Generated API groups",
    "",
    ...[...pages.entries()]
      .filter(([slug]) => slug.startsWith("api-"))
      .map(
        ([slug, content]) =>
          `- [\`${slug.slice(4)}\`](commands/${slug}) — ${frontmatterDescription(content)}`,
      ),
    "",
  ].join("\n");
}

function renderCommanderRoute(route: Command): string {
  const sections = collectDocumentedCommands(route).map(renderCommandSection);
  return [
    "---",
    `title: ${route.name()}`,
    `description: ${escapeYaml(route.description())}`,
    "---",
    "",
    `# ${route.name()}`,
    "",
    route.description(),
    "",
    "## Commands",
    "",
    ...sections.flatMap((section) => [section, ""]),
    globalOptionsNote(),
    "",
  ].join("\n");
}

function renderApiOverview(): string {
  return [
    "---",
    "title: api",
    "description: Discover and invoke every customer-facing AskNews API operation",
    "---",
    "",
    "# api",
    "",
    "Discover and invoke generated commands for every customer-facing AskNews API operation.",
    "",
    "## Usage",
    "",
    renderCommandSection(findCommand(["api", "list"])),
    "",
    "## API groups",
    "",
    ...[...new Set(manifest.operations.map((operation) => operation.tag))].map(
      (tag) =>
        `- [\`asknews api ${tag}\`](api-${tag}) — ${manifest.operations.filter((operation) => operation.tag === tag).length} operations`,
    ),
    "",
    "Use `asknews api <group> <operation> --help` for the installed schema and exact enums.",
    "",
    globalOptionsNote(),
    "",
  ].join("\n");
}

function renderApiTag(tag: string, operations: OperationDefinition[]): string {
  return [
    "---",
    `title: api ${tag}`,
    `description: Generated ${tag} API operations`,
    "---",
    "",
    `# api ${tag}`,
    "",
    `Generated from AskNews API ${manifest.schemaVersion}.`,
    "",
    "## Operations",
    "",
    ...operations.flatMap((operation) => [renderOperation(operation), ""]),
    globalOptionsNote(),
    "",
  ].join("\n");
}

function collectDocumentedCommands(route: Command): Command[] {
  const result: Command[] = [];
  const visit = (command: Command) => {
    if (
      command.registeredArguments.length > 0 ||
      command.options.length > 0 ||
      command.commands.length === 0
    ) {
      result.push(command);
    }
    for (const child of command.commands) visit(child);
  };
  visit(route);
  return result;
}

function renderCommandSection(command: Command): string {
  const path = commandPath(command);
  const signature = [path, ...command.registeredArguments.map(argumentSyntax)].join(" ");
  const lines = [`### \`${signature}\``, "", command.description()];
  if (command.registeredArguments.length > 0) {
    lines.push(
      "",
      "**Arguments:**",
      "",
      "| Argument | Description |",
      "| --- | --- |",
      ...command.registeredArguments.map(
        (argument) =>
          `| \`${argumentSyntax(argument)}\` | ${escapeCell(argument.description || "")}${argument.defaultValue !== undefined ? ` Default: \`${escapeCell(JSON.stringify(argument.defaultValue))}\`.` : ""} |`,
      ),
    );
  }
  const options = command.options.filter((option) => option.long !== "--help");
  if (options.length > 0) {
    lines.push(
      "",
      "**Options:**",
      "",
      "| Option | Description |",
      "| --- | --- |",
      ...options.map(optionRow),
    );
  }
  const commandExamples = examples[path];
  if (commandExamples) {
    lines.push("", "**Examples:**", "", "```bash", ...commandExamples, "```");
  }
  const commandNotes = notes[path];
  if (commandNotes) {
    lines.push("", ...commandNotes);
  }
  return lines.join("\n");
}

function renderOperation(operation: OperationDefinition): string {
  const lines = [
    `### \`asknews api ${operation.tag} ${operation.command}\``,
    "",
    operation.description || operation.summary,
    "",
    `- Request: \`${operation.method} ${operation.path}\``,
    `- Operation ID: \`${operation.operationId}\``,
    `- Safety: \`${operation.safety}\``,
  ];
  if (operation.parameters.length > 0) {
    lines.push(
      "",
      "**Options:**",
      "",
      "| Option | Description |",
      "| --- | --- |",
      ...operation.parameters.map(parameterRow),
    );
  }
  if (operation.requestBody) {
    lines.push(
      "",
      "**Request body fields:**",
      "",
      ...renderBodySchema(operation.requestBody.schema),
      "",
      "Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.",
      "Direct body options override values supplied through `--body`.",
    );
  }
  if (operation.safety === "mutating") {
    lines.push("", "This operation requires confirmation and `--yes` in non-interactive use.");
  }
  return lines.join("\n");
}

function optionRow(option: Option): string {
  const details = [
    option.description,
    option.argChoices ? `Choices: ${option.argChoices.map(String).join(", ")}.` : undefined,
    option.defaultValue !== undefined
      ? `Default: \`${escapeCell(JSON.stringify(option.defaultValue))}\`.`
      : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  return `| \`${escapeCell(option.flags)}\` | ${escapeCell(details)} |`;
}

function parameterRow(parameter: OperationParameter): string {
  const details = [
    parameter.description,
    `Location: ${parameter.location}.`,
    `Type: ${parameter.type === "array" ? `array<${parameter.itemType ?? "object"}>` : parameter.type}.`,
    parameter.required ? "Required." : "Optional.",
    parameter.allowedValues
      ? `Choices: ${parameter.allowedValues.map(String).join(", ")}.`
      : undefined,
    parameter.defaultValue !== undefined
      ? `Default: \`${escapeCell(JSON.stringify(parameter.defaultValue))}\`.`
      : undefined,
    parameter.format ? `Format: ${parameter.format}.` : undefined,
    parameter.minimum !== undefined ? `Minimum: ${parameter.minimum}.` : undefined,
    parameter.maximum !== undefined ? `Maximum: ${parameter.maximum}.` : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  return `| \`--${parameter.name.replaceAll("_", "-")}\` | ${escapeCell(details)} |`;
}

function renderBodySchema(schema: unknown): string[] {
  if (!schema || typeof schema !== "object") return ["Schema details are unavailable."];
  const value = schema as {
    required?: string[];
    properties?: Record<string, unknown>;
    oneOf?: unknown[];
    anyOf?: unknown[];
  };
  if (!value.properties) {
    const variants = value.oneOf ?? value.anyOf;
    return variants ? [`The body accepts ${variants.length} schema alternatives.`] : [];
  }
  const rows = ["| Option | Type | Required | Description |", "| --- | --- | --- | --- |"];
  for (const [name, rawField] of Object.entries(value.properties)) {
    const field = rawField as {
      type?: string;
      description?: string;
      default?: unknown;
      enum?: unknown[];
      format?: string;
      anyOf?: { type?: string }[];
      oneOf?: { type?: string }[];
      items?: { type?: string };
    };
    const details = [
      field.description,
      field.enum ? `Choices: ${field.enum.map(String).join(", ")}.` : undefined,
      field.default !== undefined
        ? `Default: \`${escapeCell(JSON.stringify(field.default))}\`.`
        : undefined,
      field.format ? `Format: ${field.format}.` : undefined,
    ]
      .filter(Boolean)
      .join(" ");
    rows.push(
      `| \`--${name.replaceAll("_", "-")}\` | ${schemaType(field)} | ${value.required?.includes(name) ? "yes" : "no"} | ${escapeCell(details)} |`,
    );
  }
  return rows;
}

function schemaType(field: {
  type?: string;
  anyOf?: { type?: string }[];
  oneOf?: { type?: string }[];
  items?: { type?: string };
}): string {
  if (field.type === "array") return `array<${field.items?.type ?? "object"}>`;
  if (field.type) return field.type;
  return [...new Set((field.oneOf ?? field.anyOf ?? []).map((variant) => variant.type))]
    .filter(Boolean)
    .join(" or ");
}

function argumentSyntax(argument: Argument): string {
  const value = `${argument.name()}${argument.variadic ? "..." : ""}`;
  return argument.required ? `<${value}>` : `[${value}]`;
}

function commandPath(command: Command): string {
  const names: string[] = [];
  let current: Command | null = command;
  while (current) {
    names.unshift(current.name());
    current = current.parent;
  }
  return names.join(" ");
}

function findCommand(path: string[]): Command {
  let current = program;
  for (const name of path) {
    const next = current.commands.find((command) => command.name() === name);
    if (!next) throw new Error(`Command not found: ${path.join(" ")}`);
    current = next;
  }
  return current;
}

function globalOptionsNote(): string {
  return [
    "## Global options",
    "",
    "All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL",
    "overrides, request timeout, and color control. Result data is written to stdout; diagnostics",
    "are written to stderr.",
  ].join("\n");
}

async function resetDirectory(directory: string): Promise<void> {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}

async function listRelativeFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relative = join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listRelativeFiles(join(directory, entry.name), relative)));
    } else {
      files.push(relative);
    }
  }
  return files.sort((left, right) => {
    if (basename(left) === "SKILL.md") return -1;
    if (basename(right) === "SKILL.md") return 1;
    return left.localeCompare(right);
  });
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n+/, "");
}

function forExternal(content: string): string {
  return escapeSiteMarkdown ? escapeMdx(content) : content;
}

function frontmatterTitle(content: string): string {
  return content.match(/^title:\s*(.+)$/m)?.[1] ?? "command";
}

function frontmatterDescription(content: string): string {
  const value = content.match(/^description:\s*(.+)$/m)?.[1] ?? "";
  try {
    return JSON.parse(value) as string;
  } catch {
    return value;
  }
}

function escapeYaml(value: string): string {
  return JSON.stringify(value);
}

function escapeCell(value: string): string {
  return value.replace(/\s+/g, " ").trim().replaceAll("|", "\\|");
}
