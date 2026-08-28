# api analytics

Generated from AskNews API 0.31.1.

## Operations

### `asknews api analytics get-asset-sentiment`

Get the news sentiment for a given asset during a provided period of time.

This endpoint is good for narrow AI, like using in combination with a regressor
to forecast prices etc.

- Request: `GET /v1/analytics/finance/sentiment`
- Operation ID: `get_asset_sentiment`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--asset` | The asset name to query for sentiment. Location: query. Type: string. Required. Choices: bitcoin, ethereum, cardano, uniswap, ripple, solana, polkadot, polygon, chainlink, tether, dogecoin, monero, tron, binance, aave, tesla, microsoft, amazon. |
| `--metric` | The metric to obtain. Weighted metrics account for page-rank of original source. Higher page rank sources are weighted more heavily. Location: query. Type: string. Optional. Choices: news_positive, news_negative, news_total, news_positive_weighted, news_negative_weighted, news_total_weighted. Default: `"news_positive"`. |
| `--date-from` | The start date in ISO format Location: query. Type: string. Optional. |
| `--date-to` | The end date in ISO format Location: query. Type: string. Optional. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
