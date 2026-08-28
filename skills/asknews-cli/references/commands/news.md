# news

Search and inspect AskNews articles

## Commands

### `asknews news search [query]`

Search enriched real-time or historical news

**Arguments:**

| Argument | Description |
| --- | --- |
| `[query]` | Query string that can be any phrase, keyword, question, or paragraph. This is a semantic search, so natural language is supported, but keywords are prioritized. Keywords present in this query will help attract news that contain those same keywords. There is some internal keyword expansion that helps find more relevant news as well. If you need string keyword/entity constraints, use the string_guarantee or entity_guarantee parameters below. Default: `""`. |

**Options:**

| Option | Description |
| --- | --- |
| `-n, --limit <number>` | The number of articles to return. Depends on your plan but it is usually 10. If you need more, you should use the offset parameter from a previous response to paginate through results. Default: `"10"`. |
| `--time-filter <value>` | Control which date type to filter on. 'crawl_date' is the date the article was crawled, 'pub_date' is the date the article was published. [query, string, optional, default: "pub_date"] Choices: crawl_date, pub_date. |
| `--offset <value>` | Offset for pagination. This value is stored in response.offset from previous search responses. Put that value here and run the query again to get the next page of results. [query, string, optional, default: 0] |
| `--categories <value>` | The list of categories that the articles in the search results should belong to. If None, then no category filtering will be applied (all categories allowed). [query, array<string>, optional, allowed: All\|Business\|Economy\|Crime\|Politics\|Science\|Sports\|Technology\|Military\|Health\|Entertainment\|Finance\|Culture\|Climate\|Environment\|World] |
| `--provocative <value>` | Filter articles based on how provocative they are deemed based on the use of provocative language and emotional vocabulary. If None, then no provocative filtering will be applied (all levels allowed). [query, string, optional] Choices: unknown, low, medium, high, all. |
| `--reporting-voice <value>` | The type of reporting voice that the original article used in its writing style. If None, then no reporting voice filtering will be applied (all types allowed). [query, array<string>, optional, allowed: Objective\|Subjective\|Investigative\|Narrative\|Analytical\|Advocacy\|Conversational\|Satirical\|Emotive\|Explanatory\|Persuasive\|Sensational\|Unknown\|all] |
| `--domain-url <value>` | Filter by domain url of interest. This can be a single domain or a list of domains. For example, ['npr.org'] or ['apnews.com', 'nature.com', 'npr.org', 'telegraph.co.uk']. If None, then no domain filtering will be applied (all domains allowed). [query, array<string>, optional] |
| `--bad-domain-url <value>` | Blacklist of domains that must be excluded from results. This can be a single domain url or a list of domain urls. [query, array<string>, optional] |
| `--page-rank <value>` | Maximum allowed page rank for returned articles. Use this to focus on higher quality sources, lower page rank means higher quality. Usually 100000 or lower will target top sources. But this can go up to 10_000_000. [query, integer, optional] |
| `--hours-back <value>` | This controls the historical cut off for the search. For example, setting this to 24 means that the search will only occur on articles from the last 24 hours. It can be set up to 3840 hours (which is 160 days). The time_filter parameters controls whether this will be on the pub_date or crawl_date. [query, integer, optional, default: 24] |
| `--start-datetime <iso>` | Start datetime for filtering articles (ISO 8601, e.g. '2026-01-01T00:00:00Z'). Alternative to hours_back. If provided with end_datetime, takes precedence over hours_back. start_datetime and end_datetime must be less than 160 days apart. If only start_datetime is provided, end_datetime defaults to now. For ranges >160 days, split into multiple searches. |
| `--end-datetime <iso>` | End datetime for filtering articles (ISO 8601, e.g. '2025-01-31T23:59:59Z'). Alternative to hours_back. If provided with start_datetime, takes precedence over hours_back. start_datetime and end_datetime must be less than 160 days apart. For ranges >160 days, split into multiple searches. |
| `--string-guarantee <value>` | If defined, the search will only occur on articles that contain strings in this list. For example, ['climate change', 'global warming'] will constrain the search to only articles that contain these phrases. Very good for targeted searches, where a certain keyword must be present. This is optional. [query, array<string>, optional] |
| `--string-guarantee-op <value>` | Operator to use for string guarantee list. [query, string, optional, default: "AND"] Choices: AND, OR. |
| `--reverse-string-guarantee <value>` | If defined, the search will only occur on articles that do not contain strings in this list. This is powerful for avoiding articles with a particular name or concept. It is optional. [query, array<string>, optional] |
| `--entity-guarantee <value>` | Entity(s) that *must* be present in the search results. This is a list of strings, where each string includes entity type and entity value separated by a colon. The first element is the entity type and the second element is the entity value. For example ['Location:Paris', 'Person:John McCartney', 'Product:Television', 'Sports:Broncos']. Allowed types are: Person, Organization, Location, Event, Date, Sports, Politics, Title, Arms, Product, Media, Transportation, Religion, Technology, Medicine, Language, Science [query, array<string>, optional] |
| `--entity-guarantee-op <value>` | Operator to use for entity guarantee list. [query, string, optional, default: "OR"] Choices: AND, OR. |
| `--reverse-entity-guarantee <value>` | Entities that can *NOT* be present in the search results. This is a list of strings where each string includes entity type and entity value separated by a colon. The first element is the entity type and the second element is the entity value. For example ['Location:Paris', 'Person:John'] [query, array<string>, optional] |
| `--languages <value>` | Original article language to filter the search on. This is the two-letter 'set 1' of the ISO 639-1 standard. For example: English is 'en'. Please keep in mind that all data is returned in English, regardless of the original article language. This filter only controls which languages the original articles were written in. [query, array<string>, optional, allowed: en\|de\|es\|fr\|it\|pt\|ru\|ar\|tr\|zh\|jp\|ko\|sv\|nl\|no\|da\|uk\|pl\|hi] |
| `--countries <value>` | Publisher countries to filter by (this is only for the publisher location, not the locations mentioned in articles. For Locations mentioned in articles, use entity_guarantee parameter with 'Location:'), countries must be the two-letter ISO country code. For example: United States is 'US', France is 'FR', Sweden is 'SE'. [query, array<string>, optional] |
| `--countries-blacklist <value>` | Source countries to blacklist from search (this is only for the publisher location, not the locations mentioned in articles. For Locations mentioned in articles, use reverse_entity_guarantee parameter with 'Location:'), countries must be the two-letter ISO country code. For example: United States is 'US', France is 'FR', Sweden is 'SE'. [query, array<string>, optional] |
| `--continents <value>` | Filter on articles where the content is most related to continents in this list. [query, array<string>, optional, allowed: Africa\|Asia\|Oceania\|Europe\|Middle East\|North America\|South America] |
| `--sentiment <value>` | Sentiment to filter articles on. [query, string, optional] Choices: negative, neutral, positive. |
| `--authors <value>` | Authors to filter articles by. [query, array<string>, optional] |
| `--return-type <value>` | Format to return articles in. 'dicts' returns a list of article dictionaries with full metadata. 'string' returns a prompt-optimized string format. String is good for accepting concise input into LLMs, dicts is good for detailed analysis and using large json objects for further processing. [query, string, optional, default: "dicts"] Choices: string, dicts. |

**Examples:**

```bash
asknews news search "latest AI policy" --limit 5
asknews news search "chip export controls" --categories Technology --hours-back 48 --output json
```

### `asknews news get <article-id>`

Get an article by ID

**Arguments:**

| Argument | Description |
| --- | --- |
| `<article-id>` | AskNews article UUID |

**Examples:**

```bash
asknews news get ARTICLE_ID --output json
```

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
