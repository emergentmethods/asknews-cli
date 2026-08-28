# api forecast

Generated from AskNews API 0.31.1.

## Operations

### `asknews api forecast get-forecast`

Make an expert forecast for a news event.

This endpoint reaches into the news archive, looking back `lookback` days to
extract the most relevant news articles, building a timeline of events, and
then making an expert forecast.

This endpoint is more expensive than the search endpoint, it is calling
gpt-4o or claude 3-5 on approx 15k tokens to build the forecast.
This endpoint counts toward "deep" calls in the billing system.

It returns the forecast, the reasoning, and the sources.

- Request: `GET /v1/chat/forecast`
- Operation ID: `get_forecast`
- Safety: `high-cost`

**Options:**

| Option | Description |
| --- | --- |
| `--query` | The requested forecast. Location: query. Type: string. Required. |
| `--lookback` | The number of days to look back for the forecast. Location: query. Type: integer. Optional. Default: `14`. |
| `--articles-to-use` | The total number of relevant articles to be extracted from the news archive and used for the forecast. Location: query. Type: integer. Optional. Default: `15`. |
| `--method` | Method to use for the context search Currently only 'kw' is supported. Location: query. Type: string. Optional. Default: `"kw"`. |
| `--model` | The model to use for the forecast. Location: query. Type: string. Optional. Choices: gpt-4o, gpt-4o-mini, gpt-4.1-2025-04-14, claude-3-5-sonnet-latest, claude-3-5-sonnet-20240620, claude-sonnet-4-20250514, claude-opus-4-20250514, claude-sonnet-4-5-20250929, claude-opus-4-6, claude-sonnet-4-6, claude-sonnet-5, o1-mini, o3-mini, o3. Default: `"gpt-4.1-2025-04-14"`. |
| `--cutoff-date` | The cutoff date for the forecast. String format is 'YYYY-MM-DD-HH:MM'. This is useful for backtesting forecasts. Location: query. Type: string. Optional. |
| `--use-reddit` | Whether to use Reddit data for the forecast.enterprise customers only. Location: query. Type: boolean. Optional. Default: `false`. |
| `--additional-context` | Additional context to use for the forecast. Location: query. Type: string. Optional. |
| `--web-search` | Whether to run a live web search and include results in the forecast. enterprise customers only. Location: query. Type: boolean. Optional. Default: `false`. |
| `--expert` | The type of expert to use for the forecast. Location: query. Type: string. Optional. Choices: general, sports. Default: `"general"`. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
