# web

Search the live web

## Commands

### `asknews web <query>`

Search the live web

**Arguments:**

| Argument | Description |
| --- | --- |
| `<query>` | web search query |

**Options:**

| Option | Description |
| --- | --- |
| `--hours-back <hours>` | compatibility alias for --lookback |
| `--lookback <value>` | Number of hours back to allow the websearch to look. Defaults to All time [query, string, optional] |
| `--start-datetime <value>` | Earliest acceptable publication datetime for results. For v1, acts like the existing lookback filter. [query, string, optional] |
| `--end-datetime <value>` | Latest acceptable publication datetime for results. [query, string, optional] |
| `--engine <value>` | Search engine version to use for live websearch results. [query, string, optional, default: "v1"] Choices: v1, v1.5. |
| `--domains <value>` | A list of domains to search. [query, string, optional] |
| `--strict [boolean]` | If true, the websearch will only return results that have a known publication date and are within the lookback period. [query, boolean, optional, default: false] |
| `--offset <value>` | The number of results to offset for followup queries. Numeric for regular websearch; X (Twitter) searches return an opaque cursor string in response.offset — pass it back here to paginate. [query, string, optional, default: 0] |

**Examples:**

```bash
asknews web "recent central bank statements" --output json
```

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
