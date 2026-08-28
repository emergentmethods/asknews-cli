import { describe, expect, test } from "vitest";
import { escapeMdx } from "../scripts/mdx.js";

describe("escapeMdx", () => {
  test("escapes JSX-significant characters in plain prose", () => {
    expect(escapeMdx("Pass {lon, lat} pairs and a <doc> tag.")).toBe(
      "Pass &#123;lon, lat&#125; pairs and a &lt;doc> tag.",
    );
  });

  test("leaves inline code spans untouched", () => {
    expect(escapeMdx("Use `--geo-polygon <value>` with `{exterior: []}`.")).toBe(
      "Use `--geo-polygon <value>` with `{exterior: []}`.",
    );
  });

  test("escapes prose but not the code span on the same line", () => {
    expect(escapeMdx("array<string> via `--uuids <value>`")).toBe(
      "array&lt;string> via `--uuids <value>`",
    );
  });

  test("never touches fenced code blocks", () => {
    const input = [
      "Before <x>",
      "```bash",
      "asknews api news <op> {json}",
      "```",
      "After {y}",
    ].join("\n");
    expect(escapeMdx(input)).toBe(
      [
        "Before &lt;x>",
        "```bash",
        "asknews api news <op> {json}",
        "```",
        "After &#123;y&#125;",
      ].join("\n"),
    );
  });

  test("never touches YAML frontmatter", () => {
    const input = ["---", "title: a<b> {c}", "---", "Body <d> {e}"].join("\n");
    expect(escapeMdx(input)).toBe(
      ["---", "title: a<b> {c}", "---", "Body &lt;d> &#123;e&#125;"].join("\n"),
    );
  });
});
