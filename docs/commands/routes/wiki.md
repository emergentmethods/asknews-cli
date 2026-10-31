---
title: wiki
description: "Search Wikipedia"
---

# wiki

Search Wikipedia

## Commands

### `asknews wiki <query>`

Search Wikipedia

**Arguments:**

| Argument | Description |
| --- | --- |
| `<query>` | Wikipedia search query |

**Options:**

| Option | Description |
| --- | --- |
| `-n, --limit <number>` | alias for --n-documents Default: `"10"`. |
| `--neighbor-chunks <value>` | Number of neighbor chunks to attach and return. If 0, then no neighbor chunks will be returned. [query, integer, optional, min: 0, max: 10, default: 1] |
| `--full-articles [boolean]` | If true, then full articles will be returned. If false, then only chunks and their neighbors will be returned. Beware that returning full articles increases data size which increases token usage downstream. [query, boolean, optional, default: false] |
| `--hybrid-search [boolean]` | If true, then hybrid search will be used. If false, then only vector search will be used. [query, boolean, optional, default: false] |
| `--string-guarantee <value>` | List of strings that must be present in the results. If empty, then no string guarantee will be applied. [query, array<string>, optional] |
| `--diversify <value>` | Diversity factor for MMR re-ranking. 0.0 means no diversity (pure relevance), 1.0 means full diversity. [query, number, optional, min: 0, max: 1, default: 0] |
| `--include-main-section [boolean]` | If true, then the main section of the article will be included at the start of each chunk's content. If false, then only the chunk content will be returned. Useful because the main section often contains important context. [query, boolean, optional, default: false] |

**Examples:**

```bash
asknews wiki "semiconductor lithography" --output json
```

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
