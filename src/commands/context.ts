import type { Command } from "commander";
import { type CliConfig, type GlobalOptions, resolveConfig } from "../lib/config.js";
import { type OutputWriter, writeResult } from "../lib/output.js";

export interface CommandContext {
  config: CliConfig;
  writer: OutputWriter;
}

export function contextFrom(command: Command): CommandContext {
  const options = command.optsWithGlobals<GlobalOptions>();
  const config = resolveConfig(options);
  return {
    config,
    writer: {
      stdout: process.stdout,
      stderr: process.stderr,
      format: config.output,
      color: !config.noColor && Boolean(process.stdout.isTTY),
    },
  };
}

export function outputResponse(command: Command, data: unknown): void {
  writeResult(contextFrom(command).writer, data);
}
