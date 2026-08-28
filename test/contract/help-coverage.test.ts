import type { Command } from "commander";
import { describe, expect, test } from "vitest";
import { buildCli } from "../../src/cli.js";
import manifestJson from "../../src/generated/operations.json" with { type: "json" };
import { type JsonSchema, optionName } from "../../src/lib/schema-options.js";
import type { OperationManifest } from "../../src/lib/types.js";

const manifest = manifestJson as OperationManifest;

describe("command help OpenAPI coverage", () => {
  test("every generated parameter and body field is a direct option", () => {
    const program = buildCli();
    for (const operation of manifest.operations) {
      const flags = flagsFor(findCommand(program, ["api", operation.tag, operation.command]));
      for (const parameter of operation.parameters) {
        expect(flags, operation.operationId).toContain(`--${optionName(parameter.name)}`);
      }
      const schema = operation.requestBody?.schema as JsonSchema | null;
      for (const field of Object.keys(schema?.properties ?? {})) {
        expect(flags, operation.operationId).toContain(`--${optionName(field)}`);
      }
    }
  });

  test("every curated command exposes the complete underlying option set", () => {
    const program = buildCli();
    const cases: {
      path: string[];
      operationId: string;
      excludedParameters?: string[];
      excludedBody?: string[];
    }[] = [
      {
        path: ["x"],
        operationId: "live_web_search",
        excludedParameters: ["queries", "domains", "engine", "strict"],
      },
      {
        path: ["stories", "list"],
        operationId: "get_stories",
        excludedParameters: ["query", "limit"],
      },
      { path: ["stories", "get"], operationId: "get_story", excludedParameters: ["story_id"] },
      { path: ["research"], operationId: "deep_news", excludedBody: ["messages"] },
      { path: ["web"], operationId: "live_web_search", excludedParameters: ["queries"] },
      {
        path: ["reddit"],
        operationId: "search_reddit",
        excludedParameters: ["keywords", "n_threads"],
      },
      {
        path: ["wiki"],
        operationId: "search_wiki",
        excludedParameters: ["query", "n_documents"],
      },
      { path: ["alerts", "list"], operationId: "get_alerts" },
      { path: ["alerts", "get"], operationId: "get_alert", excludedParameters: ["alert_id"] },
      { path: ["alerts", "create"], operationId: "create_alert" },
      { path: ["alerts", "update"], operationId: "put_alert", excludedParameters: ["alert_id"] },
      { path: ["alerts", "run"], operationId: "run_alert", excludedParameters: ["alert_id"] },
    ];
    for (const item of cases) {
      const operation = manifest.operations.find(
        (candidate) => candidate.operationId === item.operationId,
      );
      expect(operation).toBeTruthy();
      const flags = flagsFor(findCommand(program, item.path));
      for (const parameter of operation?.parameters ?? []) {
        if (item.excludedParameters?.includes(parameter.name)) continue;
        expect(flags, item.path.join(" ")).toContain(`--${optionName(parameter.name)}`);
      }
      const schema = operation?.requestBody?.schema as JsonSchema | null;
      for (const field of Object.keys(schema?.properties ?? {})) {
        if (item.excludedBody?.includes(field)) continue;
        expect(flags, item.path.join(" ")).toContain(`--${optionName(field)}`);
      }
    }
  });

  test("news search exposes exactly the MCP-mirrored option set", () => {
    const program = buildCli();
    const flags = [...flagsFor(findCommand(program, ["news", "search"]))].sort();
    expect(flags).toEqual(
      [
        "--limit",
        "--time-filter",
        "--offset",
        "--categories",
        "--provocative",
        "--reporting-voice",
        "--domain-url",
        "--bad-domain-url",
        "--page-rank",
        "--hours-back",
        "--start-datetime",
        "--end-datetime",
        "--string-guarantee",
        "--string-guarantee-op",
        "--reverse-string-guarantee",
        "--entity-guarantee",
        "--entity-guarantee-op",
        "--reverse-entity-guarantee",
        "--languages",
        "--countries",
        "--countries-blacklist",
        "--continents",
        "--sentiment",
        "--authors",
        "--return-type",
      ].sort(),
    );
    const apiFlags = flagsFor(findCommand(program, ["api", "news", "search-news"]));
    for (const flag of [
      "--method",
      "--strategy",
      "--historical",
      "--premium",
      "--start-timestamp",
    ]) {
      expect(apiFlags, "api news search-news keeps the full schema surface").toContain(flag);
    }
  });

  test("x mirrors the MCP search_x_twitter tool and hides pinned parameters", () => {
    const flags = flagsFor(findCommand(buildCli(), ["x"]));
    for (const flag of [
      "--lookback",
      "--start-datetime",
      "--end-datetime",
      "--offset",
      "--return-type",
    ]) {
      expect(flags).toContain(flag);
    }
    for (const flag of ["--queries", "--domains", "--engine", "--strict"]) {
      expect(flags).not.toContain(flag);
    }
  });

  test("help renders enum, default, required, and range metadata", () => {
    const help = findCommand(buildCli(), ["research"]).helpInformation();
    expect(help).toContain("--model <value>");
    expect(help).toContain("claude-sonnet-4-6");
    expect(help).toContain("--search-depth <value>");
    expect(help).toContain("min: 1");
    expect(help).toContain("max: 190");
    expect(help).toContain("--stream [boolean]");
  });

  test("every command renders help and has unique long options", () => {
    walkCommands(buildCli(), (command) => {
      expect(() => command.helpInformation()).not.toThrow();
      const flags = command.options.map((option) => option.long).filter(Boolean);
      expect(new Set(flags).size, command.name()).toBe(flags.length);
      expect(command.helpInformation()).not.toContain("[object Object]");
    });
  });
});

function findCommand(root: Command, path: string[]): Command {
  let command = root;
  for (const name of path) {
    const next = command.commands.find((candidate) => candidate.name() === name);
    if (!next) throw new Error(`Missing command: ${path.join(" ")}`);
    command = next;
  }
  return command;
}

function flagsFor(command: Command): Set<string | undefined> {
  return new Set(command.options.map((option) => option.long));
}

function walkCommands(command: Command, visit: (command: Command) => void): void {
  visit(command);
  for (const child of command.commands) walkCommands(child, visit);
}
