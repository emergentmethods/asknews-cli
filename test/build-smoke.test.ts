import { execFile } from "node:child_process";
import { mkdtemp, readFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { beforeAll, describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);

const pkgVersion = JSON.parse(await readFile(resolve("package.json"), "utf8")).version as string;

describe("built executable", () => {
  beforeAll(async () => {
    await execFileAsync("pnpm", ["tsx", "scripts/build.ts"], {
      env: process.env,
    });
  });

  test("starts and renders help", async () => {
    const { stdout } = await execFileAsync(process.execPath, ["dist/bin.js", "--help"]);
    expect(stdout).toContain("The official AskNews CLI");
    expect(stdout).toContain("QUICK START");
    expect(stdout).toContain("DISCOVER COMMANDS");
    expect(stdout).toContain("AUTHENTICATION");
    expect(stdout).toContain("OUTPUT CONTRACT");
    expect(stdout).toContain("SAFETY");
    expect(stdout).toContain("api");
    expect(stdout).toContain("auth");
  });

  test("starts when invoked through an installed-style bin symlink", async () => {
    const root = await mkdtemp(join(tmpdir(), "asknews-bin-link-"));
    const executable = join(root, "asknews");
    await symlink(resolve("dist/bin.js"), executable);
    const { stdout } = await execFileAsync(executable, ["--version"]);
    expect(stdout.trim()).toBe(pkgVersion);
  });

  test("renders detailed generated operation help", async () => {
    const { stdout } = await execFileAsync(process.execPath, [
      "dist/bin.js",
      "api",
      "news",
      "search-news",
      "--help",
    ]);
    expect(stdout).toContain("OPERATION");
    expect(stdout).toContain("API options:");
    expect(stdout).toContain("EXAMPLES");
    expect(stdout).toContain("--query <value>");
    expect(stdout).toContain("--n-articles <value>");
    expect(stdout).toContain('choices: "crawl_date", "pub_date"');
    expect(stdout).toMatch(/default:\s+10/);
  });

  test("provides a machine-readable operation catalog", async () => {
    const { stdout } = await execFileAsync(process.execPath, [
      "dist/bin.js",
      "api",
      "list",
      "--tag",
      "news",
      "--output",
      "json",
    ]);
    const operations = JSON.parse(stdout) as { command: string; parameters: unknown[] }[];
    expect(operations.length).toBeGreaterThan(0);
    expect(operations[0]?.command).toMatch(/^asknews api news /);
    expect(operations.some((operation) => operation.parameters.length > 0)).toBe(true);
  });
});
