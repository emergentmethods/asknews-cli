---
title: api reddit
description: Generated reddit API operations
---

# api reddit

Generated from AskNews API 0.31.1.

## Operations

### `asknews api reddit search-reddit`

Go to Reddit, search threads, summarize the threads, return analysis.
`deep`=True is a live web scrape, AskNews searches Reddit, finds threads,
summarizes them, analyzes them, and returns the results. `deep`=False
is a search in AskNews' existing database of Reddit threads.

- Request: `GET /v1/reddit/search`
- Operation ID: `search_reddit`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--keywords` | Keywords used to search for relevant Reddit threads. Location: query. Type: array<string>. Required. |
| `--n-threads` | Number of Reddit threads to summarize and return Location: query. Type: integer. Optional. Default: `5`. |
| `--method` | The search method. Can be 'nl' or 'kw'. If 'nl', then the query will be used as a natural language query. If 'kw', then the query will be used as a direct keyword query. Location: query. Type: string. Optional. Choices: nl, kw. Default: `"kw"`. |
| `--deep` | Deep means that AskNews goes directly to Reddit, searches live, summarizes the threads live, and returns structured data for you. Deep=False means that AskNews looks in its existing database of Reddit threads and returns the most similar threads Location: query. Type: boolean. Optional. Default: `false`. |
| `--return-type` | The return type. Can be 'dicts', 'string', or 'both'. Location: query. Type: string. Optional. Choices: dicts, string, both. Default: `"string"`. |
| `--time-filter` | The time filter. Location: query. Type: string. Optional. Choices: hour, day, week, month, year, all. Default: `"day"`. |
| `--sort` | The sort order. Location: query. Type: string. Optional. Choices: relevance, hot, top, new, comments. Default: `"relevance"`. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
