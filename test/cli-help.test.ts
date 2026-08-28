import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { buildCli } from "../src/cli.js";

describe("CLI help tree", () => {
  test("root help explains operation, discovery, auth, output, and safety", () => {
    const help = renderHelp(buildCli());
    expect(help).toContain("DESIGNED FOR");
    expect(help).toContain("QUICK START");
    expect(help).toContain("DISCOVER COMMANDS");
    expect(help).toContain("AUTHENTICATION");
    expect(help).toContain("OUTPUT CONTRACT");
    expect(help).toContain("SAFETY");
  });

  test("registers curated groups and every generated operation", () => {
    const cli = buildCli();
    for (const name of [
      "auth",
      "news",
      "stories",
      "research",
      "web",
      "reddit",
      "wiki",
      "x",
      "alerts",
      "api",
      "cli",
    ]) {
      expect(cli.commands.some((command) => command.name() === name)).toBe(true);
    }
    const api = cli.commands.find((command) => command.name() === "api");
    expect(api).toBeDefined();
    const news = api?.commands.find((command) => command.name() === "news");
    const searchNews = news?.commands.find((command) => command.name() === "search-news");
    expect(searchNews ? renderHelp(searchNews) : "").toContain("--n-articles <value>");
    expect(searchNews ? renderHelp(searchNews) : "").toContain("max: 101");
    expect(searchNews?.options.some((option) => option.long === "--yes")).toBe(false);
    expect(searchNews?.options.some((option) => option.long === "--body")).toBe(false);
    const alerts = api?.commands.find((command) => command.name() === "alerts");
    const createAlert = alerts?.commands.find((command) => command.name() === "create-alert");
    expect(createAlert?.options.some((option) => option.long === "--yes")).toBe(true);
    expect(createAlert?.options.some((option) => option.long === "--body")).toBe(true);
  });

  test("documents a deterministic public-safe project directory default", async () => {
    const cli = buildCli();
    const cliGroup = cli.commands.find((command) => command.name() === "cli");
    const setup = cliGroup?.commands.find((command) => command.name() === "setup");
    const directory = setup?.options.find((option) => option.long === "--directory");
    expect(directory?.defaultValue).toBe(".");
    expect(isAbsolute(String(directory?.defaultValue))).toBe(false);

    for (const path of [
      "docs/commands/routes/cli.md",
      "skills/asknews-cli/references/commands/cli.md",
    ]) {
      const generated = await readFile(resolve(path), "utf8");
      expect(generated).toContain('| `--directory <path>` | project directory Default: `"."`. |');
      expect(generated).not.toContain(process.cwd());
    }
  });
});

function renderHelp(command: ReturnType<typeof buildCli>): string;
function renderHelp(command: import("commander").Command): string;
function renderHelp(command: import("commander").Command): string {
  let output = "";
  command.configureOutput({
    writeOut: (value) => {
      output += value;
    },
    writeErr: (value) => {
      output += value;
    },
  });
  command.outputHelp();
  return output;
}
