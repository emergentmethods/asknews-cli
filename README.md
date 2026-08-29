# AskNews CLI

[![npm version](https://img.shields.io/npm/v/%40emergentmethods%2Fasknews-cli?label=npm)](https://www.npmjs.com/package/@emergentmethods/asknews-cli)

The official AskNews command-line interface for humans, scripts, CI, and AI agents.

## Install

Requires Node.js 22.15 or newer.

Run without installing:

```bash
npx @emergentmethods/asknews-cli --help
```

Install globally with npm:

```bash
npm install -g @emergentmethods/asknews-cli
asknews --help
```

Or use the install script (installs under `~/.local` by default):

```bash
curl -fsSL https://docs.asknews.app/cli/install | bash
asknews --help
```

Run the install script with `--help` for version, prefix, checksum, PATH, local-tarball, and
agent-skill options.

From a source checkout:

```bash
pnpm install
pnpm build
pnpm package:tarball
./install --tarball release/*.tgz
```

## Quick start

```bash
asknews auth login
asknews news search "latest semiconductor policy" --limit 5
asknews news search "latest semiconductor policy" --limit 5 --output json
```

For CI and agents:

```bash
export ASKNEWS_API_KEY="your-api-key"
asknews auth status --output json
```

API keys can also be stored locally with `asknews auth login --api-key`. Authentication precedence
is `--api-key`, `ASKNEWS_API_KEY`, stored OAuth, then stored API key.

## Command discovery

`--help` is the canonical human interface at every command level:

```bash
asknews --help
asknews news --help
asknews api news search-news --help
```

For programmatic discovery:

```bash
asknews api list --output json
```

The CLI provides curated news, stories, DeepNews, alerts, web, Reddit, Wikipedia, and X (Twitter) workflows.
Every customer-facing public OpenAPI operation is also available under
`asknews api <group> <operation>`. A generic authenticated escape hatch is available as
`asknews request METHOD PATH`.

## Output and safety

Use `--output human|table|json|jsonl|yaml` or `--json`. Human mode renders compact domain-specific
tables for articles, stories, models, and alerts; `table` forces tabular list output. Result data is
written to stdout and diagnostics to stderr. Noninteractive state-changing operations require
`--yes`. High-cost operations are labeled in help and the machine-readable operation catalog.

Every OpenAPI parameter and request-body field is represented by a kebab-case option with its type,
required state, default, enum values, format, and numeric range in `--help`.

```bash
asknews research --help
asknews research models
asknews research "Compare current AI regulations" \
  --model claude-sonnet-4-6 \
  --sources asknews \
  --sources reddit \
  --stream
```

## Agent skill

Package installation embeds the AskNews skill under the standard global agent directory. Opt out
with `ASKNEWS_NO_AGENT_SKILLS=1`, or install/refresh explicitly:

```bash
asknews cli setup --scope global
asknews cli setup --scope project --directory .
```

## Development

```bash
pnpm sync:openapi
pnpm check
pnpm build
pnpm test:live
```

The production API defaults to `https://api.asknews.app/v1`. Override it with `ASKNEWS_API_URL` or
`--api-url`. See [docs/README.md](docs/README.md) for architecture, generated coverage, ADRs,
testing safeguards, and the release process.
