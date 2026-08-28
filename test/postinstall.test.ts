import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);

describe("package postinstall", () => {
  test("resolves the package location and supports lifecycle-safe home configuration", async () => {
    const root = await mkdtemp(join(tmpdir(), "asknews-postinstall-"));
    const home = join(root, "home");
    const unrelatedCwd = join(root, "project");
    const packageRoot = join(root, "package");
    await mkdir(unrelatedCwd, { recursive: true });
    await mkdir(join(packageRoot, "scripts"), { recursive: true });
    await cp(resolve("skills"), join(packageRoot, "skills"), { recursive: true });
    await cp(resolve("scripts/postinstall.mjs"), join(packageRoot, "scripts/postinstall.mjs"));

    await execFileAsync(process.execPath, [join(packageRoot, "scripts/postinstall.mjs")], {
      cwd: unrelatedCwd,
      env: {
        ...process.env,
        ASKNEWS_AGENT_HOME: undefined,
        npm_config_asknews_agent_home: home,
      },
    });

    expect(
      await readFile(join(home, ".agents", "skills", "asknews-cli", "SKILL.md"), "utf8"),
    ).toContain("name: asknews-cli");
  });
});
