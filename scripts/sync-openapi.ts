import { spawn } from "node:child_process";

const checkOnly = process.argv.includes("--check");

await run("pnpm", ["generate"]);
await run("pnpm", [
  "exec",
  "biome",
  "check",
  "--write",
  "scripts",
  "src",
  "test",
  "docs/commands/README.md",
]);
await run("pnpm", ["typecheck"]);
await run("pnpm", [
  "exec",
  "vitest",
  "run",
  "test/contract/openapi-coverage.test.ts",
  "test/contract/help-coverage.test.ts",
  "test/help.test.ts",
  "test/cli-help.test.ts",
]);
await run("pnpm", ["build:bundle"]);

if (checkOnly) {
  const changed = await capture("git", [
    "status",
    "--short",
    "--untracked-files=all",
    "--",
    "src/generated",
    "docs/commands",
    "skills/asknews-cli/references/commands",
  ]);
  if (changed.trim()) {
    process.stderr.write(
      "OpenAPI-generated files are stale. Run `pnpm sync:openapi` and review the diff:\n",
    );
    process.stderr.write(changed);
    process.exitCode = 1;
  }
}

async function run(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code ?? "unknown"}`));
    });
  });
}

async function capture(command: string, args: string[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "inherit"], env: process.env });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      output += chunk;
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code ?? "unknown"}`));
    });
  });
}
