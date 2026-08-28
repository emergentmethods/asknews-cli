# api wiki

Generated from AskNews API 0.31.1.

## Operations

### `asknews api wiki search-wiki`

Search on Wikipedia content with natural language. Find exactly relevant chunks,
with contextual neighbor chunks, and the full articles they came from.

- Request: `GET /v1/wiki/search`
- Operation ID: `search_wiki`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--query` | Natural language query that can be any phrase, keyword, question, or paragraph. Location: query. Type: string. Optional. Default: `""`. |
| `--neighbor-chunks` | Number of neighbor chunks to attach and return. If 0, then no neighbor chunks will be returned. Location: query. Type: string. Optional. Default: `1`. |
| `--n-documents` | Number of documents to return. If 0, then no documents will be returned. Location: query. Type: string. Optional. Default: `5`. |
| `--full-articles` | If true, then full articles will be returned. If false, then only chunks and their neighbors will be returned. Beware that returning full articles increases data size which increases token usage downstream. Location: query. Type: string. Optional. Default: `false`. |
| `--hybrid-search` | If true, then hybrid search will be used. If false, then only vector search will be used. Location: query. Type: string. Optional. Default: `false`. |
| `--string-guarantee` | List of strings that must be present in the results. If empty, then no string guarantee will be applied. Location: query. Type: string. Optional. |
| `--diversify` | Diversity factor for MMR re-ranking. 0.0 means no diversity (pure relevance), 1.0 means full diversity. Location: query. Type: string. Optional. Default: `0`. |
| `--include-main-section` | If true, then the main section of the article will be included at the start of each chunk's content. If false, then only the chunk content will be returned. Useful because the main section often contains important context. Location: query. Type: string. Optional. Default: `false`. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
