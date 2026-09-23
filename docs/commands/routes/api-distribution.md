---
title: api distribution
description: Generated distribution API operations
---

# api distribution

Generated from AskNews API 0.32.1.

## Operations

### `asknews api distribution domain-hit-share`

Get the hit share for a list of domains in a time period.

- Request: `GET /v1/distribution/stats/hit_share`
- Operation ID: `domain_hit_share`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--domain-names` | Domain names to filter by Location: query. Type: array<string>. Required. |
| `--start-date` | Start date to filter by (timestamp in seconds since epoch) Location: query. Type: string. Optional. |
| `--end-date` | End date to filter by (timestamp in seconds since epoch) Location: query. Type: string. Optional. |
| `--is-publisher` | Only calculate hit share for publisher domains Location: query. Type: boolean. Optional. Default: `true`. |

### `asknews api distribution top-n-articles-for-domains`

Get the top N domain articles ranked by the selected metric.

- Request: `GET /v1/distribution/articles/top_n_for_domains`
- Operation ID: `top_n_articles_for_domains`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--domain-names` | Domain names to filter by Location: query. Type: array<string>. Required. |
| `--limit` | Number of top domain articles to return (page size) Location: query. Type: integer. Optional. Default: `10`. Minimum: 1. Maximum: 100. |
| `--page` | Page number (1-based; page size = limit) Location: query. Type: integer. Optional. Default: `1`. Minimum: 1. |
| `--start-date` | Start date to filter by (timestamp in seconds since epoch) Location: query. Type: string. Optional. |
| `--end-date` | End date to filter by (timestamp in seconds since epoch) Location: query. Type: string. Optional. |
| `--metric` | Metric used to rank and count the returned articles Location: query. Type: string. Optional. Choices: surface, citation, grounded. Default: `"surface"`. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
