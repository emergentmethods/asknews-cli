# stories

Search and inspect news stories

## Commands

### `asknews stories list`

List or search stories

**Options:**

| Option | Description |
| --- | --- |
| `-q, --query <query>` | story search query |
| `-n, --limit <number>` | number of stories Default: `"10"`. |
| `--hours-back <hours>` | convenience alias for --start-timestamp |
| `--categories <value>` | Categories to use for filtering the stories search [query, array<string>, optional, default: []] |
| `--uuids <value>` | A list of UUIDs to retrieve. [query, array<string>, optional, default: []] |
| `--start-timestamp <value>` | Start timestamp to filter results on. [query, string, optional] |
| `--end-timestamp <value>` | End timestamp to filter results on. [query, string, optional] |
| `--sort-by <value>` | Which type of sorting to perform. published: Sort by published date. coverage: Sort by coverage. sentiment: Sort by sentiment. relevance: Sort by relevance of similarity score/ranking. [query, string, optional] |
| `--sort-type <value>` | Whether to sort results in ascending or descending order. [query, string, optional] |
| `--continent <value>` | Continents to filter by. [query, string, optional] |
| `--offset <value>` | Offset to use [query, string, optional, default: 0] |
| `--expand-updates [boolean]` | Whether to expand updates [query, boolean, optional, default: false] |
| `--max-updates <value>` | Max updates to use [query, integer, optional, default: 2] |
| `--max-articles <value>` | Max articles to use per update [query, integer, optional, default: 5] |
| `--method <value>` | Method to use for query, 'nl' means natural language, and will run a semantic search on the stories database. 'kw' means keyword, and will search by keyword on the stories database. 'both' means that both methods will be used and results will be ranked according to IRR. [query, string, optional, default: "kw"] Choices: nl, kw, both. |
| `--obj-type <value>` | Object type to filter by, can be a list with 'story' and/or 'story_update' [query, array<string>, optional, default: ["story"]] |
| `--reddit <value>` | Whether or not to include Reddit analysiswhere the integer indicates the number of threadsto include in the response. 0 is default. Requirespaid plan to access. [query, integer, optional, default: 0] |
| `--citation-method <value>` | Method to use for citation filtering. [query, string, optional, default: "brackets"] Choices: brackets, urls, none. |
| `--similarity-score-threshold <value>` | Similarity score threshold to use when using query [query, number, optional, default: 0.75] |
| `--provocative <value>` | Filter stories based on how provocative the underlying articles are deemed based on the use of provocative language and emotional vocabulary. [query, string, optional, default: "all"] Choices: unknown, low, medium, high, all. |
| `--strategy <value>` | Strategy to use for automatically controlling the search. 'default' is the default strategy, which follows all filters faithfully. 'topstories' aims to give a diverse look at top news stories that are relevant to the current filter combination.'topstories_categories' aims to give the top stories for each category. 'topstories_continents' aims to give the top stories for each continent. [query, string, optional, default: "default"] Choices: default, topstories, topstories_categories, topstories_continents. |

**Examples:**

```bash
asknews stories list --query "European elections" --limit 5 --output json
```

### `asknews stories get <story-id>`

Get a story or story update

**Arguments:**

| Argument | Description |
| --- | --- |
| `<story-id>` | story or update UUID |

**Options:**

| Option | Description |
| --- | --- |
| `--expand-updates [boolean]` | Whether to expand updates [query, boolean, optional, default: true] |
| `--max-updates <value>` | Max number of updates to include in the story object [query, integer, optional, default: 10] |
| `--max-articles <value>` | Max articles to include per update [query, integer, optional, default: 25] |
| `--reddit <value>` | Whether to include Reddit analysis [query, integer, optional, default: 0] |
| `--citation-method <value>` | Method to use for citation filtering. [query, string, optional, default: "brackets"] Choices: brackets, urls, none. |
| `--condense-auxillary-updates [boolean]` | When requesting a particular story update, you can expand the assocaited updates by settined max_updates to the total you would like to get. If you want those updates to by condensed for reduced latency, you can set condense_auxillary_updates to 'False'. [query, boolean, optional, default: true] |

**Examples:**

```bash
asknews stories get STORY_ID --output json
```

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
