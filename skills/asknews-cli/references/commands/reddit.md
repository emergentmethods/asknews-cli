# reddit

Search Reddit threads

## Commands

### `asknews reddit <query>`

Search Reddit threads

**Arguments:**

| Argument | Description |
| --- | --- |
| `<query>` | Reddit search query |

**Options:**

| Option | Description |
| --- | --- |
| `-n, --limit <number>` | alias for --n-threads Default: `"10"`. |
| `--method <value>` | The search method. Can be 'nl' or 'kw'. If 'nl', then the query will be used as a natural language query. If 'kw', then the query will be used as a direct keyword query. [query, string, optional, default: "kw"] Choices: nl, kw. |
| `--deep [boolean]` | Deep means that AskNews goes directly to Reddit, searches live, summarizes the threads live, and returns structured data for you. Deep=False means that AskNews looks in its existing database of Reddit threads and returns the most similar threads [query, boolean, optional, default: false] |
| `--return-type <value>` | The return type. Can be 'dicts', 'string', or 'both'. [query, string, optional, default: "string"] Choices: dicts, string, both. |
| `--time-filter <value>` | The time filter. [query, string, optional, default: "day"] Choices: hour, day, week, month, year, all. |
| `--sort <value>` | The sort order. [query, string, optional, default: "relevance"] Choices: relevance, hot, top, new, comments. |

**Examples:**

```bash
asknews reddit "consumer reactions" --output json
```

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
