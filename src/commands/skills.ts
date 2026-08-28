import { cp, mkdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Command } from "commander";
import { UsageError } from "../lib/errors.js";
import { writeResult } from "../lib/output.js";
import { contextFrom } from "./context.js";

type InstallScope = "all" | "global" | "project";

export function registerSkillCommands(program: Command): void {
  const cli = program.command("cli").description("Manage the AskNews CLI installation");
  cli
    .command("setup")
    .description("Install embedded AskNews skills into detected agent directories")
    .option("--scope <scope>", "global, project, or all", "global")
    .option("--directory <path>", "project directory", ".")
    .option("--no-agent-skills", "skip agent skill installation")
    .option("--quiet", "suppress human setup messages")
    .action(
      async (
        options: {
          scope: InstallScope;
          directory: string;
          agentSkills: boolean;
          quiet?: boolean;
        },
        command,
      ) => {
        const { writer } = contextFrom(command);
        if (!options.agentSkills) {
          writeResult(writer, { installed: [], skipped: "agent skills disabled" });
          return;
        }
        if (!["all", "global", "project"].includes(options.scope)) {
          throw new UsageError("--scope must be global, project, or all");
        }
        const installed = await installAgentSkills(options.scope, resolve(options.directory));
        if (!options.quiet || writer.format !== "human") {
          writeResult(writer, { installed });
        }
      },
    );
}

export async function installAgentSkills(
  scope: InstallScope,
  projectDirectory: string,
): Promise<string[]> {
  const source = await findSkillSource();
  const targets = new Set<string>();
  if (scope === "global" || scope === "all") {
    const agentHome =
      process.env.ASKNEWS_AGENT_HOME ?? process.env.npm_config_asknews_agent_home ?? homedir();
    targets.add(join(agentHome, ".agents", "skills", "asknews-cli"));
    const claudeRoot = join(agentHome, ".claude");
    if (await exists(claudeRoot)) targets.add(join(claudeRoot, "skills", "asknews-cli"));
  }
  if (scope === "project" || scope === "all") {
    targets.add(join(projectDirectory, ".agents", "skills", "asknews-cli"));
    if (await exists(join(projectDirectory, ".claude"))) {
      targets.add(join(projectDirectory, ".claude", "skills", "asknews-cli"));
    }
  }
  const installed: string[] = [];
  for (const target of targets) {
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true, force: true });
    installed.push(target);
  }
  return installed.sort();
}

async function findSkillSource(): Promise<string> {
  let current = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = join(current, "skills", "asknews-cli");
    if (await exists(candidate)) {
      return candidate;
    }
    current = dirname(current);
  }
  throw new UsageError("Embedded AskNews skill could not be found");
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
