# auth

Authenticate the AskNews CLI

## Commands

### `asknews auth login`

Log in with OAuth device flow or an API key

**Options:**

| Option | Description |
| --- | --- |
| `--api-key [key]` | store an API key instead of using OAuth |
| `--no-browser` | do not open the verification URL |
| `--scope <scope...>` | OAuth scopes Default: `["openid","offline_access","news","chat","stories","analytics","distribution","profile","reddit"]`. |

**Examples:**

```bash
asknews auth login
asknews auth login --no-browser
```

### `asknews auth status`

Show the active authentication method and verify it against AskNews

**Options:**

| Option | Description |
| --- | --- |
| `--offline` | inspect local state without an API request |

**Examples:**

```bash
asknews auth status --output json
```

### `asknews auth logout`

Remove locally stored AskNews credentials

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
