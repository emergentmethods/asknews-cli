import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.ASKNEWS_NO_AGENT_SKILLS !== "1") {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const source = resolve(packageRoot, "skills/asknews-cli");
  const agentHome =
    process.env.ASKNEWS_AGENT_HOME || process.env.npm_config_asknews_agent_home || homedir();
  if (existsSync(source) && !existsSync(resolve(packageRoot, ".git"))) {
    const agentRoots = [join(agentHome, ".agents")];
    const claudeRoot = join(agentHome, ".claude");
    if (existsSync(claudeRoot)) agentRoots.push(claudeRoot);
    for (const agentRoot of agentRoots) {
      const target = join(agentRoot, "skills", "asknews-cli");
      try {
        mkdirSync(dirname(target), { recursive: true });
        cpSync(source, target, { recursive: true, force: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`AskNews agent skill setup skipped for ${agentRoot}: ${message}\n`);
      }
    }
  }
}
