# AGENTS.md — asknews-cli

The official TypeScript command-line client for the public AskNews API. It owns the `asknews`
executable, schema-driven command coverage, curated research workflows, local authentication,
structured output contracts, embedded agent skills, and generated command documentation. It calls
the AskNews API gateway and OAuth issuer; it owns no server-side data.

## ⚠️ This is a PUBLIC repository — do not adopt the internal agents standard

This repo is published as the public npm package `@emergentmethods/asknews-cli`, and the README,
bundle, and embedded skill ship to npmjs.com. Public-facing cleanliness is a hard requirement.

- **Never run "adopt company standards" tooling here**, and never re-vendor the company's internal
  agent skills into `.agents/skills/` or `.claude/skills/` (those paths are git-ignored on purpose).
- **Do not recreate the internal docs taxonomy** (`docs/features/`, `docs/incidents/`,
  `docs/archive/`, `docs/tools/`). Internal status/feature/incident tracking for this CLI lives in
  the company's internal hub repo (the `asknews-cli` feature umbrella), not here. Keep in this repo
  only README, `docs/architecture/`, `docs/commands/`, and `docs/decisions/`.
- **Never introduce internal references** — no internal Git host URLs or hostnames, no references to
  internal hub/sandbox config, no non-production API hosts, internal plan or credential names,
  secrets, or `.env` values — in any tracked file, especially the README and the embedded
  `skills/asknews-cli/`.
- Before publishing, confirm `npm publish --dry-run` ships only `dist/`, `skills/`, `package.json`,
  `README`, `LICENSE`, and the postinstall script.

## Stack

- **Language:** TypeScript 5.9 on Node.js 22.15+
- **Framework:** Commander for command routing; Clack for prompts
- **Data:** local JSON credential/config files only, under a mode-0700 config directory
- **External services:** AskNews API and AskNews OAuth/OIDC issuer
- **Output:** human terminal rendering (cli-table3 tables fit to terminal width; URLs as OSC 8
  hyperlinks via terminal-link) plus JSON, JSONL, and YAML
- **Tooling:** pnpm 10.11, esbuild, Biome, Vitest, fast-check

## Architecture map

```text
src/bin.ts                 # process entrypoint and central error handling
src/cli.ts                 # root command and command registration
src/commands/              # auth, generated API, curated workflows, skills
src/auth/                  # device flow, refresh, and mode-0600 credential storage
src/generated/             # pinned OpenAPI snapshot and generated operation manifest
src/lib/                   # HTTP, config, output, errors, OpenAPI request construction
scripts/                   # schema/docs generation and bundling
skills/asknews-cli/        # skill embedded into the npm package
test/                      # unit, contract, integration, snapshot, and opt-in live tests
docs/                      # architecture, command reference, runbooks, and decisions
```

The generator downloads the public OpenAPI schema, filters customer-facing operations, and emits a
deterministic operation manifest. Runtime commands use that manifest to construct authenticated
requests. Curated commands are thin, tested adapters over the same operation executor.

## Commands

```bash
pnpm install               # install dependencies
pnpm sync:openapi          # refresh schema, help/docs, contracts, and executable
pnpm sync:openapi:check    # CI drift check; fails when generated files change
pnpm sync:docs             # sync command docs + skill into the docs app (ASKNEWS_DOCS_APP_DIR)
pnpm sync:docs:check       # CI drift check; fails when the docs app is out of sync
pnpm dev -- --help         # run from TypeScript
pnpm lint                  # Biome checks
pnpm typecheck             # strict TypeScript
pnpm test                  # unit/contract/integration/snapshot tests; no live calls
pnpm test:live             # opt-in; requires guarded dev credentials
pnpm check                 # lint + typecheck + non-live tests
pnpm build                 # generate and bundle dist/bin.js
```

## Conventions

- Branches: `main` (stable). Conventional commits.
- `stdout` is result data only. Diagnostics, progress, and warnings go to `stderr`.
- Never print, log, snapshot, or fixture API keys, access tokens, refresh tokens, or authorization
  headers.
- Generated operation coverage is measured against `src/generated/openapi.json`; do not hand-edit
  generated files.
- Non-interactive commands must never prompt. Respect `CI`, non-TTY streams, and explicit flags.
- Destructive or billable live tests require both the live-test gate and an operation-specific gate.
- Publishing the npm package happens through the release workflow on a `v*` tag; do not publish by hand.

## Docs map

- `docs/architecture/` — command/request/auth data flow
- `docs/commands/` — generated per-command reference
- `docs/runbooks/` — development, schema refresh, live testing, and release procedures
- `docs/decisions/` — immutable architecture decisions

Same-PR discipline applies to decisions and this file.

## Gotchas

- The API key is sent as `Authorization: Bearer <key>`, not `X-API-Key`, at the API gateway.
- The schema URL is the server root plus `/openapi.json`; the configured API URL includes `/v1`.
- Opt-in live tests read a test-only key from `ASKNEWS_LIVE_API_KEY` and target `ASKNEWS_API_URL`
  (default production); they never run in the default suite and never touch credentials in logs.
- OAuth device flow requires the configured public client ID to be registered by the AskNews auth
  service. Never ship a confidential client secret in this package.
- OpenAPI operations can be expensive or mutating even when their HTTP method is GET.
- The docs app's CLI command pages and `.well-known` skill are generated; sync them with
  `pnpm sync:docs`, never hand-edit them. The command pages are MDX, so the site output is escaped
  (`<`/`{`/`}` outside code spans); the `.well-known` skill stays raw for agents. The hand-written
  `cli/index.md` and `cli/agentic-usage.md` are not synced — update those by hand. See
  `docs/decisions/0004-docs-site-sync.md`.

## Updating this file

Repo knowledge goes here or in `docs/`. Convention changes require human sign-off. Fix this file in
the same change that makes it wrong.
