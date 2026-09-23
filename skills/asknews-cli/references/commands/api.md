# api

Discover and invoke generated commands for every customer-facing AskNews API operation.

## Usage

### `asknews api list`

List generated operations and their parameters

**Options:**

| Option | Description |
| --- | --- |
| `--tag <tag>` | filter by API group |
| `--safety <level>` | filter by read-only, high-cost, or mutating |

**Examples:**

```bash
asknews api list --output json
asknews api list --tag news --safety read-only --output json
```

## API groups

- [`asknews api alerts`](api-alerts) — 8 operations
- [`asknews api autofilter`](api-autofilter) — 1 operations
- [`asknews api byok`](api-byok) — 3 operations
- [`asknews api chat`](api-chat) — 3 operations
- [`asknews api distribution`](api-distribution) — 2 operations
- [`asknews api forecast`](api-forecast) — 1 operations
- [`asknews api graph`](api-graph) — 1 operations
- [`asknews api index-urls`](api-index-urls) — 1 operations
- [`asknews api news`](api-news) — 4 operations
- [`asknews api ping`](api-ping) — 1 operations
- [`asknews api profile`](api-profile) — 2 operations
- [`asknews api reddit`](api-reddit) — 1 operations
- [`asknews api stories`](api-stories) — 2 operations
- [`asknews api websearch`](api-websearch) — 1 operations
- [`asknews api wiki`](api-wiki) — 1 operations

Use `asknews api <group> <operation> --help` for the installed schema and exact enums.

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
