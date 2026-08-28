# 0004 — Docs site sync ownership

**Status:** Accepted · **Date:** 2026-06-23 · **Supersedes / Superseded by:** —

## Context

The customer docs app (`frontend/apps/docs`, a separate repository) renders a CLI section whose
command-reference pages and published `.well-known` Agent Skill are derived from this repo. The
first version was a one-time manual import: there was no automated sync, the docs app had already
silently drifted (two commands were undocumented), and the transform that makes the generated
Markdown safe for the docs app's MDX renderer (`<`, `{`, `}` escaped outside code) lived nowhere in
code — it had been applied by hand and was effectively lost knowledge.

Two coupled questions had to be answered together: where the MDX-escaping transform should live, and
how to keep two separate repos from drifting.

## Options considered

1. **Manual copy (status quo):** keep hand-importing generated files. Zero new tooling, but
   guaranteed drift — already proven — and the escaping stays tribal.
2. **Escape in the generator, write straight into the docs app:** smallest change, but couples the
   generator to one consumer's renderer and offers no drift detection or staging for a `--check`.
3. **Keep the generator renderer-agnostic; do escaping + placement entirely in a docs-app
   ingestion script:** clean separation, but the docs-app repo's CI would need this repo checked out
   and would own a transform whose rules belong to the source format.
4. **Publish a versioned docs bundle from this package; the docs app consumes it at build time:**
   true single source of truth with no committed copies, but the largest lift (artifact pipeline,
   build-time fetch, serving the raw skill files) — disproportionate for the current stage.

## Decision

Adopt a hybrid (chosen by the user from these options). The MDX-escaping transform becomes code in
this repo (`scripts/mdx.ts`), gated by `ASKNEWS_DOCS_MDX_ESCAPE` so it applies only to the
MDX-rendered **site** command pages; the `.well-known` skill and in-repo Markdown stay raw because
agents and GitHub read plain Markdown. A placement script (`scripts/sync-docs-site.ts`, `pnpm
sync:docs`) maps the generator's flat output onto the docs app's layout, mirrors the two discovery
manifests, deletes files the generator no longer owns, and never touches the hand-written
`cli/index.md` / `cli/agentic-usage.md`. `pnpm sync:docs:check` is a cross-repo drift gate, pointed
at the docs app via `ASKNEWS_DOCS_APP_DIR`.

The deciding reasons, in order of weight: drift had already caused real staleness, so a `--check`
gate was the primary requirement; the escaping rules are a property of the generated format, so they
belong with the generator, not the consumer; and the artifact-pipeline option's cost was not
justified yet.

## Consequences

This commits us to keeping the escaper faithful to the docs app's MDX behavior (covered by unit
tests) and to running `sync:docs:check` after schema, skill, or curated-command changes. The gate
requires the docs app checkout to be available, so it runs where both repos are present rather than
in this repo's isolated CI. The hand-written CLI landing pages remain a manual same-change
responsibility. If a third consumer of the generated docs appears, revisit option 4.
