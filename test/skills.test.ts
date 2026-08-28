import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { installAgentSkills } from "../src/commands/skills.js";

describe("agent skill installation", () => {
  test("installs the embedded skill project-locally", async () => {
    const project = await mkdtemp(join(tmpdir(), "asknews-skill-"));
    const installed = await installAgentSkills("project", project);
    expect(installed).toEqual([join(project, ".agents", "skills", "asknews-cli")]);
    expect(await readFile(join(installed[0] ?? "", "SKILL.md"), "utf8")).toContain(
      "name: asknews-cli",
    );
    expect(
      await readFile(join(installed[0] ?? "", "references", "task-recipes.md"), "utf8"),
    ).toContain("## DeepNews research");
    expect(
      await readFile(join(installed[0] ?? "", "references", "commands", "news.md"), "utf8"),
    ).toContain("asknews news search");
    const skill = await readFile(join(installed[0] ?? "", "SKILL.md"), "utf8");
    expect(skill).toContain("Select the command");
    expect(skill).toContain("references/task-recipes.md");
    expect(skill).toContain("references/commands/index.md");
    expect(skill).toContain("straightforward search");
    expect(skill).toContain("Never infer permission from access to credentials");
  });

  test("uses ASKNEWS_AGENT_HOME for global installation", async () => {
    const home = await mkdtemp(join(tmpdir(), "asknews-agent-home-"));
    await mkdir(join(home, ".agents"), { recursive: true });
    const previous = process.env.ASKNEWS_AGENT_HOME;
    process.env.ASKNEWS_AGENT_HOME = home;
    try {
      await expect(installAgentSkills("global", process.cwd())).resolves.toEqual([
        join(home, ".agents", "skills", "asknews-cli"),
      ]);
    } finally {
      if (previous === undefined) delete process.env.ASKNEWS_AGENT_HOME;
      else process.env.ASKNEWS_AGENT_HOME = previous;
    }
  });
});
