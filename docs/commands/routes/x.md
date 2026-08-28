---
title: x
description: "Search X (Twitter) with an advanced search expression"
---

# x

Search X (Twitter) with an advanced search expression

## Commands

### `asknews x <expression>`

Search X (Twitter) with an advanced search expression

**Arguments:**

| Argument | Description |
| --- | --- |
| `<expression>` | Twitter/X Advanced Search expression using Twitter search syntax. Supports operators like: 'OR', 'AND', 'from:username', '@username', 'since:YYYY-MM-DD_HH:MM:SS_UTC', 'until:YYYY-MM-DD_HH:MM:SS_UTC', '#hashtag', 'filter:links', 'filter:media', etc. Example: '(bitcoin OR ethereum) AND (crash OR rally OR @elonmusk) from:elonmusk min_faves:100 -filter:replies'. You can also use lookback parameter instead of since/until for relative time filtering. |

**Options:**

| Option | Description |
| --- | --- |
| `--lookback <value>` | Number of hours back to allow the search to look. Defaults to all time if not specified. Use this to constrain results to recent tweets. [query, string, optional] |
| `--start-datetime <value>` | Start datetime for filtering results (ISO 8601, e.g. '2026-01-01T00:00:00Z'). Alternative to lookback. If provided with end_datetime, takes precedence over lookback. start_datetime and end_datetime must be less than 160 days apart. For ranges >160 days, split into multiple searches. [query, string, optional] |
| `--end-datetime <value>` | End datetime for filtering results (ISO 8601, e.g. '2025-01-31T23:59:59Z'). Alternative to lookback. If provided with start_datetime, takes precedence over lookback. start_datetime and end_datetime must be less than 160 days apart. For ranges >160 days, split into multiple searches. [query, string, optional] |
| `--offset <value>` | Opaque pagination cursor for followup queries. X (Twitter) searches return it in response.offset — pass it back here unchanged to fetch the next page. [query, string, optional, default: 0] |
| `--return-type <format>` | Format to return results in. 'dicts' returns a list of result dictionaries with full metadata. 'string' returns a prompt-optimized string format. String is good for accepting concise input into LLMs, dicts is good for detailed analysis and using large json objects for further processing. Choices: string, dicts. Default: `"dicts"`. |

**Examples:**

```bash
asknews x "from:elonmusk min_faves:100 -filter:replies" --lookback 24 --output json
asknews x "(bitcoin OR ethereum) AND (crash OR rally)" --start-datetime 2026-01-01T00:00:00Z --end-datetime 2026-01-31T00:00:00Z --output json
```

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
