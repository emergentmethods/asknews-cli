# api index-urls

Generated from AskNews API 0.32.1.

## Operations

### `asknews api index-urls index-urls`

Index a list of news article URLs.

- Request: `POST /v1/news/index_urls`
- Operation ID: `index_urls`
- Safety: `mutating`

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--start-time` | string | yes | Format: date-time. |
| `--end-time` | string | yes | Format: date-time. |
| `--urls` | array<object> | yes |  |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

This operation requires confirmation and `--yes` in non-interactive use.

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
