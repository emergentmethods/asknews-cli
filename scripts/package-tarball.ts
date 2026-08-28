import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const releaseDirectory = resolve("release");

await mkdir(releaseDirectory, { recursive: true });
await execFileAsync("pnpm", ["build"], { env: process.env });
const { stdout } = await execFileAsync("pnpm", ["pack", "--pack-destination", releaseDirectory], {
  env: { ...process.env, ASKNEWS_NO_AGENT_SKILLS: "1" },
});

const filename = stdout.trim().split(/\r?\n/).at(-1);
if (!filename?.endsWith(".tgz")) {
  throw new Error(`Could not determine package tarball from pnpm output: ${stdout}`);
}

const tarball = resolve(releaseDirectory, filename);
const checksum = createHash("sha256")
  .update(await readFile(tarball))
  .digest("hex");
await writeFile(`${tarball}.sha256`, `${checksum}  ${filename}\n`, "utf8");

process.stdout.write(`Created ${tarball}\n`);
process.stdout.write(`SHA-256 ${checksum}\n`);
