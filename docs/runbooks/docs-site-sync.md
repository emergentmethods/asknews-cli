# Docs site sync

The customer docs app (`frontend/apps/docs`) renders a CLI section whose **command reference** and
**published Agent Skill** are generated from this repository. Those files are owned by the generator,
not hand-edited in the docs app. Keep them in sync from here:

```bash
ASKNEWS_DOCS_APP_DIR=/path/to/frontend/apps/docs pnpm sync:docs
```

`sync:docs` regenerates the command pages and skill, then mirrors them onto the docs app's layout:

- `src/docs/en/cli/commands/` — per-command pages, `index.md`, and `nav.json` (MDX-rendered).
- `public/.well-known/skills/asknews-cli/` — the published skill tree (served raw to agents).
- `public/.well-known/index.json` and `.../skills/index.json` — the skill discovery manifests.

It writes only inside those generated areas and deletes files the generator no longer owns (for
example, `search.md` after the source split into `web`/`reddit`/`wiki`). The hand-written landing
page (`cli/index.md`) and agentic guide (`cli/agentic-usage.md`) are never touched; update those by
hand in the same change when commands are renamed or added.

## MDX escaping

The command pages render through MDX, so the generator emits MDX-safe Markdown for the **site**
output: `<`, `{`, and `}` are escaped to `&lt;`, `&#123;`, and `&#125;` in plain prose, but left raw
inside inline code spans, fenced code blocks, and frontmatter (`scripts/mdx.ts`). The `.well-known`
skill files stay raw because skill-consuming agents read plain Markdown, not MDX. Escaping is gated
by `ASKNEWS_DOCS_MDX_ESCAPE=1`, which `sync:docs` sets automatically.

## CI drift gate

```bash
ASKNEWS_DOCS_APP_DIR=/path/to/frontend/apps/docs pnpm sync:docs:check
```

The check variant performs the same synchronization in memory and exits non-zero (listing the
affected files) if the docs app would change. Run it after `sync:openapi`, and after editing the
embedded skill or curated commands. Because the docs app is a separate repository, the gate needs
its checkout available at `ASKNEWS_DOCS_APP_DIR`.

## After syncing

- Review the docs app diff; it must stay inside the two generated areas above.
- Run the docs app link checker: `pnpm --filter docs check:links`.
- Commit the docs app changes in that repository, and the generator/skill changes here, together.
