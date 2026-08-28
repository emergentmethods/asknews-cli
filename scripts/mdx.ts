// Escape `<`, `{`, and `}` so the MDX compiler does not read them as JSX, but only in plain prose:
// inline code spans (`` `...` ``), fenced code blocks, and YAML frontmatter are left untouched,
// matching MDX's own parsing rules. Used for the docs-site command pages, which render through MDX;
// in-repo Markdown and the published Agent Skill stay raw.
export function escapeMdx(content: string): string {
  const lines = content.split("\n");
  let inFence = false;
  let inFrontmatter = false;
  return lines
    .map((line, index) => {
      if (index === 0 && line.trim() === "---") {
        inFrontmatter = true;
        return line;
      }
      if (inFrontmatter) {
        if (line.trim() === "---") inFrontmatter = false;
        return line;
      }
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      return inFence ? line : escapeMdxLine(line);
    })
    .join("\n");
}

function escapeMdxLine(line: string): string {
  let result = "";
  let index = 0;
  while (index < line.length) {
    if (line[index] === "`") {
      const end = line.indexOf("`", index + 1);
      if (end === -1) return result + escapeMdxText(line.slice(index));
      result += line.slice(index, end + 1);
      index = end + 1;
    } else {
      const next = line.indexOf("`", index);
      const segment = next === -1 ? line.slice(index) : line.slice(index, next);
      result += escapeMdxText(segment);
      index = next === -1 ? line.length : next;
    }
  }
  return result;
}

function escapeMdxText(text: string): string {
  return text.replaceAll("<", "&lt;").replaceAll("{", "&#123;").replaceAll("}", "&#125;");
}
