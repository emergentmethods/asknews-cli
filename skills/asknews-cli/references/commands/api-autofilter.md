# api autofilter

Generated from AskNews API 0.31.1.

## Operations

### `asknews api autofilter autofilter`

This is a helper endpoint designed to intelligently populate the
"parameters of the /news search endpoint of AskNews. It takes a description
of the type of news that you want to access, and then maps it to the available
parameters automatically.

This endpoint returns the parameters, called filter_params, which can be used
in a variety of other AskNews endpoints, for example, /news, /graph, /chat.

- Request: `GET /v1/chat/autofilter`
- Operation ID: `autofilter`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--query` | A description of what kind of news you want to get. Location: query. Type: string. Required. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
