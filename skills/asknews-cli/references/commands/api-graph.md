# api graph

Generated from AskNews API 0.31.1.

## Operations

### `asknews api graph build-graph`

Explore our mega-news-knowledge-graph at which ever level of resolution you need.

Fully disambiguated and ready to be used in any downstream application.

Pass a natural language query to get a graph of the latest news. Add parameters
to build a graph from our archive, filter your graph by language, country, reporting voice,
sentiment, provocative levels, and much more.

- Request: `POST /v1/news/graph`
- Operation ID: `build_graph`
- Safety: `high-cost`

**Request body fields:**

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `--query` | string | no | Query string that can be any phrase, keyword, question, or paragraph. If method='nl', then this will be used as a natural language query. If method='kw', then this will be used as a direct keyword query. Default: `""`. |
| `--return-articles` | boolean | no | Whether to return articles or not. Default: `false`. |
| `--min-cluster-probability` | number | no | Minimum cluster probability to use for disambiguation Default: `0.9`. |
| `--geo-disambiguation` | boolean | no | Whether to use geo disambiguation or not. Default: `false`. |
| `--filter-params` | object or null | no | All parameters available on the search_news endpoint located here: https://docs.asknews.app/en/reference#get-/v1/news/search |
| `--constrained-disambiguations` | array or null | no | Disambiguation correction parameters. |
| `--docs-upload` | array or null | no | Document upload parameters. |
| `--visualize-with` | string or null | no | Request a visualization graph returned in the response. |

Use direct kebab-case body options, `--body '{...}'`, or `--body @request.json`.
Direct body options override values supplied through `--body`.

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
