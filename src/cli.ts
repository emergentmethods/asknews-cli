import chalk from "chalk";
import { Command, Option } from "commander";
import packageJson from "../package.json" with { type: "json" };
import { registerApiCommands } from "./commands/api.js";
import { registerAuthCommands } from "./commands/auth.js";
import { registerCuratedCommands } from "./commands/curated.js";
import { registerSkillCommands } from "./commands/skills.js";
import { bannerEnabled, renderBanner } from "./lib/banner.js";
import { manifest } from "./lib/operations.js";
import { OUTPUT_FORMATS } from "./lib/types.js";

export function buildCli(): Command {
  const program = new Command()
    .name("asknews")
    .description("The official AskNews CLI for humans, automation, and agents")
    .version(packageJson.version)
    .showHelpAfterError()
    .showSuggestionAfterError()
    // Put a blank line between each argument/option/command entry so dense, multi-line parameter
    // descriptions are easy to scan. Configured before subcommands register so it is inherited.
    .configureHelp({
      formatItemList(heading, items, helper) {
        if (items.length === 0) return [];
        const spaced = items.flatMap((item, index) =>
          index < items.length - 1 ? [item, ""] : [item],
        );
        return [helper.styleTitle(heading), ...spaced, ""];
      },
    })
    .option("--api-url <url>", "AskNews API base URL")
    .option("--auth-url <url>", "AskNews OAuth issuer URL")
    .option("--oauth-client-id <id>", "public OAuth client ID")
    .option("--api-key <key>", "API key for this invocation")
    .addOption(
      new Option("-o, --output <format>", "output format")
        .choices([...OUTPUT_FORMATS])
        .env("ASKNEWS_OUTPUT"),
    )
    .option("--json", "shortcut for --output json")
    .option(
      "--timeout <milliseconds>",
      "request timeout (default 60000; research defaults to 900000; streams treat it as an inactivity limit)",
    )
    .option("--no-color", "disable ANSI color")
    .addHelpText("before", (context) =>
      bannerEnabled()
        ? renderBanner(chalk.level > 0 && context.command.opts().color !== false)
        : "",
    )
    .addHelpText(
      "after",
      `
DESIGNED FOR
  Humans      readable tables, guided OAuth login, concise errors
  Scripts     stable exit codes and JSON/JSONL/YAML on stdout
  Agents      complete API discovery and an installable AskNews skill

QUICK START
  asknews auth login
  asknews news search "latest AI policy" --limit 5
  asknews news search "latest AI policy" --limit 5 --output json
  asknews x "from:nasa artemis" --lookback 24 --output json

DISCOVER COMMANDS
  asknews <command> --help                 Help for any command
  asknews api list                         All generated API operations
  asknews api list --output json           Machine-readable operation catalog
  asknews api <group> <operation> --help   Full parameter schema

AUTHENTICATION
  Interactive: asknews auth login
  CI/agents:   export ASKNEWS_API_KEY="..."
  Precedence:  --api-key, environment, stored OAuth, stored API key

AGENT SKILLS
  Installed automatically into detected ~/.agents and ~/.claude directories.
  ASKNEWS_NO_AGENT_SKILLS=1 disables package-install setup.
  ASKNEWS_AGENT_HOME overrides the home used for agent skill installation.

OUTPUT CONTRACT
  human  Curated readable terminal output
  table  Force tabular output for list/search results
  json   Stable structured object/array
  jsonl  One JSON record per line
  yaml   Readable structured output
  Result data goes to stdout; diagnostics go to stderr.

SAFETY
  State-changing operations prompt interactively and require --yes in CI/agents.
  High-cost operations are labeled in generated help.

API CONTRACT
  Generated from AskNews API ${manifest.schemaVersion}
  ${manifest.operations.length} customer-facing operations; internal-scope operations excluded.
`,
    );

  registerAuthCommands(program);
  registerCuratedCommands(program);
  registerApiCommands(program);
  registerSkillCommands(program);
  return program;
}
