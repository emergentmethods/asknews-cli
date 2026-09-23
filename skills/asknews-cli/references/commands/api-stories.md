# api stories

Generated from AskNews API 0.32.1.

## Operations

### `asknews api stories get-stories`

Filter on our custom, in-house written, stories/events/narratives.

These stories are based on clusters of articles (which come through this
endpoint as well, so you can consider this a clustering endpoint). We write
stories and track them through time.

The enrichments include a full Reddit overview (including all the thread metadata),
as well as descriptions of the reporting voice, the key takeaways, contradictions,
all the entities, and much, much more.

You can see this data in action, and filter it similarly at
`https://asknews.app/stories`

- Request: `GET /v1/stories`
- Operation ID: `get_stories`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--query` | Query to be used for the search. If method='nl', then this will beused as a natural language query. If method='kw', then this willbe used as a direct keyword query. Location: query. Type: string. Optional. |
| `--categories` | Categories to use for filtering the stories search Location: query. Type: array<string>. Optional. Default: `[]`. |
| `--uuids` | A list of UUIDs to retrieve. Location: query. Type: array<string>. Optional. Default: `[]`. |
| `--start-timestamp` | Start timestamp to filter results on. Location: query. Type: string. Optional. |
| `--end-timestamp` | End timestamp to filter results on. Location: query. Type: string. Optional. |
| `--sort-by` | Which type of sorting to perform. published: Sort by published date. coverage: Sort by coverage. sentiment: Sort by sentiment. relevance: Sort by relevance of similarity score/ranking. Location: query. Type: string. Optional. |
| `--sort-type` | Whether to sort results in ascending or descending order. Location: query. Type: string. Optional. |
| `--continent` | Continents to filter by. Location: query. Type: string. Optional. |
| `--offset` | Offset to use Location: query. Type: string. Optional. Default: `0`. |
| `--limit` | Limit to use Location: query. Type: integer. Optional. Default: `10`. |
| `--expand-updates` | Whether to expand updates Location: query. Type: boolean. Optional. Default: `false`. |
| `--max-updates` | Max updates to use Location: query. Type: integer. Optional. Default: `2`. |
| `--max-articles` | Max articles to use per update Location: query. Type: integer. Optional. Default: `5`. |
| `--method` | Method to use for query, 'nl' means natural language, and will run a semantic search on the stories database. 'kw' means keyword, and will search by keyword on the stories database. 'both' means that both methods will be used and results will be ranked according to IRR. Location: query. Type: string. Optional. Choices: nl, kw, both. Default: `"kw"`. |
| `--obj-type` | Object type to filter by, can be a list with 'story' and/or 'story_update' Location: query. Type: array<string>. Optional. Default: `["story"]`. |
| `--reddit` | Whether or not to include Reddit analysiswhere the integer indicates the number of threadsto include in the response. 0 is default. Requirespaid plan to access. Location: query. Type: integer. Optional. Default: `0`. |
| `--citation-method` | Method to use for citation filtering. Location: query. Type: string. Optional. Choices: brackets, urls, none. Default: `"brackets"`. |
| `--similarity-score-threshold` | Similarity score threshold to use when using query Location: query. Type: number. Optional. Default: `0.75`. |
| `--provocative` | Filter stories based on how provocative the underlying articles are deemed based on the use of provocative language and emotional vocabulary. Location: query. Type: string. Optional. Choices: unknown, low, medium, high, all. Default: `"all"`. |
| `--strategy` | Strategy to use for automatically controlling the search. 'default' is the default strategy, which follows all filters faithfully. 'topstories' aims to give a diverse look at top news stories that are relevant to the current filter combination.'topstories_categories' aims to give the top stories for each category. 'topstories_continents' aims to give the top stories for each continent. Location: query. Type: string. Optional. Choices: default, topstories, topstories_categories, topstories_continents. Default: `"default"`. |

### `asknews api stories get-story`

Get a single news story given its UUID.

- Request: `GET /v1/stories/{story_id}`
- Operation ID: `get_story`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--story-id` | The story UUID, update UUID, or URL safe title Location: path. Type: string. Required. |
| `--expand-updates` | Whether to expand updates Location: query. Type: boolean. Optional. Default: `true`. |
| `--max-updates` | Max number of updates to include in the story object Location: query. Type: integer. Optional. Default: `10`. |
| `--max-articles` | Max articles to include per update Location: query. Type: integer. Optional. Default: `25`. |
| `--reddit` | Whether to include Reddit analysis Location: query. Type: integer. Optional. Default: `0`. |
| `--citation-method` | Method to use for citation filtering. Location: query. Type: string. Optional. Choices: brackets, urls, none. Default: `"brackets"`. |
| `--condense-auxillary-updates` | When requesting a particular story update, you can expand the assocaited updates by settined max_updates to the total you would like to get. If you want those updates to by condensed for reduced latency, you can set condense_auxillary_updates to 'False'. Location: query. Type: boolean. Optional. Default: `true`. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
