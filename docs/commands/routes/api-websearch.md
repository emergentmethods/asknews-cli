---
title: api websearch
description: Generated websearch API operations
---

# api websearch

Generated from AskNews API 0.31.1.

## Operations

### `asknews api websearch live-web-search`

Run a live websearch on a set of queries, get back a fully structured and
LLM-distilled response (in addition to the raw text if you need that as well).

Your response includes as_string and as_dicts, where as_string is a prompt-optimized
distillation of the information, done by an LLM. as_dicts contains all the details
necessary to feed into other parts of your application.

- Request: `GET /v1/chat/websearch`
- Operation ID: `live_web_search`
- Safety: `high-cost`

**Options:**

| Option | Description |
| --- | --- |
| `--queries` | A list of queries to be live searched, analyzed, distilled, and structured. Location: query. Type: array<string>. Required. |
| `--lookback` | Number of hours back to allow the websearch to look. Defaults to All time Location: query. Type: string. Optional. |
| `--start-datetime` | Earliest acceptable publication datetime for results. For v1, acts like the existing lookback filter. Location: query. Type: string. Optional. |
| `--end-datetime` | Latest acceptable publication datetime for results. Location: query. Type: string. Optional. |
| `--engine` | Search engine version to use for live websearch results. Location: query. Type: string. Optional. Choices: v1, v1.5. Default: `"v1"`. |
| `--domains` | A list of domains to search. Location: query. Type: string. Optional. |
| `--strict` | If true, the websearch will only return results that have a known publication date and are within the lookback period. Location: query. Type: boolean. Optional. Default: `false`. |
| `--offset` | The number of results to offset for followup queries. Numeric for regular websearch; X (Twitter) searches return an opaque cursor string in response.offset — pass it back here to paginate. Location: query. Type: string. Optional. Default: `0`. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
