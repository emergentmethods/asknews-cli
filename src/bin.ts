#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildCli } from "./cli.js";
import { CliError } from "./lib/errors.js";
import { redact, redactString } from "./lib/redact.js";

export async function main(argv = process.argv): Promise<void> {
  // engines.node is advisory under npm/npx; guard at runtime so every install path fails clearly.
  const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 15)) {
    process.stderr.write(`asknews requires Node.js 22.15 or newer (found ${process.version}).\n`);
    process.exitCode = 1;
    return;
  }
  const program = buildCli();
  program.exitOverride();
  try {
    await program.parseAsync(argv);
  } catch (error) {
    if ((error as { code?: string }).code === "commander.helpDisplayed") {
      return;
    }
    if ((error as { code?: string }).code === "commander.version") {
      return;
    }
    if (error instanceof CliError) {
      process.stderr.write(`${redactString(error.message)}\n`);
      if (process.env.ASKNEWS_LOG_LEVEL === "debug" && error.details) {
        process.stderr.write(`${JSON.stringify(redact(error.details), null, 2)}\n`);
      }
      process.exitCode = error.exitCode;
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${redactString(message)}\n`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(realpathSync(invokedPath)).href) {
  await main();
}
