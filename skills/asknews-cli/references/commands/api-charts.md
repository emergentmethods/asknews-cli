# api charts

Generated from AskNews API 0.31.1.

## Operations

### `asknews api charts create-charts-endpoint`

Create charts.

- Request: `POST /v1/chat/charts`
- Operation ID: `create_charts_endpoint`
- Safety: `high-cost`

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--query` | string | yes | The chart query to create |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
