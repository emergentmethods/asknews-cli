import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);

describe("curl installer", () => {
  test("is valid Bash and documents npm and local installation", async () => {
    await expect(execFileAsync("bash", ["-n", "install"])).resolves.toBeDefined();
    const { stdout } = await execFileAsync("bash", ["install", "--help"]);
    expect(stdout).toContain("public npm registry");
    expect(stdout).toContain("--tarball <path>");
    expect(stdout).toContain("--no-agent-skills");
  });

  test("installs a local tarball under the requested prefix", async () => {
    const root = await mkdtemp(join(tmpdir(), "asknews-installer-"));
    const home = join(root, "home");
    const prefix = join(root, "prefix");
    const fakeBin = join(root, "fake-bin");
    const tarball = join(root, "asknews-cli-0.1.0.tgz");
    const npmArguments = join(root, "npm-arguments");

    await mkdir(home, { recursive: true });
    await mkdir(fakeBin, { recursive: true });
    await writeFile(tarball, "test package", "utf8");
    await writeFile(
      join(fakeBin, "npm"),
      `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$@" >"${npmArguments}"
prefix=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--prefix" ]]; then
    prefix="$2"
    shift 2
  else
    shift
  fi
done
mkdir -p "$prefix/bin"
cat >"$prefix/bin/asknews" <<'EOF'
#!/usr/bin/env bash
printf '0.1.0\\n'
EOF
chmod +x "$prefix/bin/asknews"
`,
      "utf8",
    );
    await chmod(join(fakeBin, "npm"), 0o755);

    const { stdout } = await execFileAsync(
      "bash",
      [
        resolve("install"),
        "--tarball",
        tarball,
        "--prefix",
        prefix,
        "--no-modify-path",
        "--no-agent-skills",
      ],
      {
        env: {
          ...process.env,
          HOME: home,
          PATH: `${fakeBin}:${process.env.PATH ?? ""}`,
          SHELL: "/bin/bash",
        },
      },
    );

    expect(stdout).toContain("AskNews CLI 0.1.0 installed successfully");
    expect(await readFile(npmArguments, "utf8")).toContain(`--prefix\n${prefix}`);
    await expect(readFile(join(home, ".bashrc"), "utf8")).rejects.toThrow();
  });
});
