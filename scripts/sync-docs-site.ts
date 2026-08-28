import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

// Sync generated CLI command docs, the public Agent Skill, and the curl install script into the
// AskNews docs app (the install script is served at docs.asknews.app/cli/install).
//
// The docs app renders Markdown through MDX, so the generator is invoked with
// ASKNEWS_DOCS_MDX_ESCAPE=1 to produce MDX-safe output. This script owns placement (mapping the
// generator's flat output onto the app's directory layout) and a `--check` drift gate for CI. It
// only writes inside the two generated areas; hand-written pages (`cli/index.md`,
// `cli/agentic-usage.md`) are never touched.

const check = process.argv.includes("--check");
const appArg = process.argv.find((value) => value.startsWith("--app="))?.slice("--app=".length);
const appDir = resolve(appArg ?? process.env.ASKNEWS_DOCS_APP_DIR ?? "");
if (!appArg && !process.env.ASKNEWS_DOCS_APP_DIR) {
  process.stderr.write(
    "Set ASKNEWS_DOCS_APP_DIR (or pass --app=<path>) to the docs app root (frontend/apps/docs).\n",
  );
  process.exit(2);
}

const commandsTarget = join(appDir, "src/docs/en/cli/commands");
const skillTarget = join(appDir, "public/.well-known/skills/asknews-cli");
const discoveryTargets = [
  join(appDir, "public/.well-known/skills/index.json"),
  join(appDir, "public/.well-known/index.json"),
];

const staging = mkdtempSync(join(tmpdir(), "asknews-docs-sync-"));
const stagedCommands = join(staging, "commands");
const stagedSkillRoot = join(staging, "skills");
const stagedSkill = join(stagedSkillRoot, "asknews-cli");

const generate = spawnSync(resolve("node_modules/.bin/tsx"), ["scripts/generate-docs.ts"], {
  stdio: ["ignore", "ignore", "inherit"],
  env: {
    ...process.env,
    ASKNEWS_DOCS_MDX_ESCAPE: "1",
    ASKNEWS_DOCS_OUTPUT_DIR: stagedCommands,
    ASKNEWS_SKILL_PUBLIC_DIR: stagedSkill,
  },
});
if (generate.status !== 0) {
  await rm(staging, { recursive: true, force: true });
  process.stderr.write("Documentation generation failed.\n");
  process.exit(generate.status ?? 1);
}

const changes: string[] = [];
await mirror(stagedCommands, commandsTarget);
await mirror(stagedSkill, skillTarget);
const discovery = await readFile(join(stagedSkillRoot, "index.json"), "utf8");
for (const target of discoveryTargets) await syncFile(target, discovery);

// Publish the curl installer at docs.asknews.app/cli/install (served from the docs app's public/).
const installScript = await readFile(resolve("install"), "utf8");
await syncFile(join(appDir, "public/cli/install"), installScript);

await rm(staging, { recursive: true, force: true });

if (check) {
  if (changes.length === 0) {
    process.stdout.write("Docs app is in sync with generated CLI documentation.\n");
    process.exit(0);
  }
  process.stderr.write(
    `Docs app is out of sync (${changes.length} file(s)). Run \`pnpm sync:docs\`:\n${changes
      .map((entry) => `  ${entry}`)
      .join("\n")}\n`,
  );
  process.exit(1);
}
process.stdout.write(
  changes.length === 0
    ? "Docs app already up to date.\n"
    : `Updated ${changes.length} file(s) in the docs app.\n`,
);

// Make `target` mirror `source` exactly: write changed/new files and delete files the generator no
// longer owns (for example, the old `search.md` after it split into web/reddit/wiki).
async function mirror(source: string, target: string): Promise<void> {
  const sourceFiles = new Set(await listFiles(source));
  const targetFiles = await listFiles(target);
  for (const relativePath of sourceFiles) {
    await syncFile(join(target, relativePath), await readFile(join(source, relativePath), "utf8"));
  }
  for (const relativePath of targetFiles) {
    if (sourceFiles.has(relativePath)) continue;
    changes.push(`delete ${relative(appDir, join(target, relativePath))}`);
    if (!check) await rm(join(target, relativePath));
  }
}

async function syncFile(target: string, content: string): Promise<void> {
  const current = await readFile(target, "utf8").catch(() => undefined);
  if (current === content) return;
  changes.push(`${current === undefined ? "create" : "update"} ${relative(appDir, target)}`);
  if (check) return;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

async function listFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(join(directory, entry.name), relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}
