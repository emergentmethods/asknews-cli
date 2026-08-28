---
title: request
description: "Make an authenticated request to an API path"
---

# request

Make an authenticated request to an API path

## Commands

### `asknews request <method> <path>`

Make an authenticated request to an API path

**Arguments:**

| Argument | Description |
| --- | --- |
| `<method>` | HTTP method |
| `<path>` | path relative to the configured /v1 base URL |

**Options:**

| Option | Description |
| --- | --- |
| `--body <json-or-file>` | JSON body or @file.json |

**Examples:**

```bash
asknews request GET /profiles/me --output json
```

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
