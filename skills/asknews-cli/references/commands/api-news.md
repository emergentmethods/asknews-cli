# api news

Generated from AskNews API 0.31.1.

## Operations

### `asknews api news get-article`

Get a single article given a UUID.

- Request: `GET /v1/news/{article_id}`
- Operation ID: `get_article`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--article-id` | Article ID to retrieve Location: path. Type: string. Required. |

### `asknews api news get-articles`

Get articles given a list of UUIDs.

- Request: `GET /v1/news`
- Operation ID: `get_articles`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--article-ids` | Article UUIDs to fetch. Location: query. Type: array<string>. Required. |
| `--full-text` | Whether to return the full text of the articles. Location: query. Type: boolean. Optional. Default: `false`. |

### `asknews api news get-index-counts`

This endpoint is primarly used for the publisher dashboard, to
show the number of articles indexed per source.

- Request: `GET /v1/index_counts`
- Operation ID: `get_index_counts`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--start-datetime` | Start timestamp to filter by Location: query. Type: string. Optional. |
| `--end-datetime` | End timestamp to filter by Location: query. Type: string. Optional. |
| `--domains` | Domain or list of domains to get indexing counts for Location: query. Type: string. Optional. |
| `--sampling` | Sampling to use Location: query. Type: string. Optional. Choices: 5m, 1h, 12h, 1d, 1w, 1m. Default: `"1d"`. |
| `--time-filter` | Control which date type to filter on. 'crawl_date' is the date the article was crawled, 'pub_date' is the date the article was published. Location: query. Type: string. Optional. Choices: crawl_date, pub_date. Default: `"pub_date"`. |
| `--categories` | Categories of news to filter on Location: query. Type: string. Optional. |
| `--provocative` | Filter articles based on how provocative they are deemed based on the use of provocative language and emotional vocabulary. Location: query. Type: string. Optional. |
| `--reporting-voice` | Type of reporting voice to filer by. Location: query. Type: string. Optional. |
| `--bad-domain-url` | blacklist of domains that must be excluded from resultsThis can be a single domain url or a list of domain urls. Location: query. Type: string. Optional. |
| `--page-rank` | maximum allowed pagerank for returned articles Location: query. Type: string. Optional. |
| `--string-guarantee` | If defined, the search will only occur on articles that contain this string. Location: query. Type: string. Optional. |
| `--string-guarantee-op` | Operator to use for string guarantee. Location: query. Type: string. Optional. Choices: AND, OR. Default: `"AND"`. |
| `--reverse-string-guarantee` | If defined, the search will only occur on articles that do not contain this string. Location: query. Type: string. Optional. |
| `--entity-guarantee` | Entity guarantee to filter by. This is a list of strings, where each string includes entity type and entity value separated by a colon. The first element is the entity type and the second element is the entity value. For example ['Location:Paris', 'Person:John'] Location: query. Type: string. Optional. |
| `--entity-guarantee-op` | Operator to use for entity guarantee. Location: query. Type: string. Optional. Choices: AND, OR. Default: `"OR"`. |
| `--languages` | Languages to filter by. This is the two-letter 'set 1' of the ISO 639-1 standard. For example: English is 'en'. Location: query. Type: string. Optional. |
| `--countries` | Source countries to filter by (this is only for the publisher location, not the locations mentioned in articles. For Locations mentioned in articles, refer to entity_guarantee), countries must be the two-letter ISO country codeFor example: United States is 'US', France is 'FR', Sweden is 'SE'. Location: query. Type: string. Optional. |
| `--countries-blacklist` | Source countries to blacklist from search (this is only for the publisher location, not the locations mentioned in articles. For Locations mentioned in articles, refer to reverse_entity_guarantee), countries must be the two-letter ISO country codeFor example: United States is 'US', France is 'FR', Sweden is 'SE'. Location: query. Type: string. Optional. |
| `--continents` | Continents to filter by Location: query. Type: string. Optional. |
| `--sentiment` | Sentiment to filter news articles by. Location: query. Type: string. Optional. |

### `asknews api news get-sources-report`

This endpoint is primarly used for transparency and monitoring the
diversity of the data.

Visualized at `https://asknews.app/transparency`.

Get the distribution of sources/languages/countries underlying AskNews content.

- Request: `GET /v1/sources`
- Operation ID: `get_sources_report`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--n-points` | Number of points to return Location: query. Type: integer. Optional. Default: `100`. |
| `--start-timestamp` | Start timestamp to filter by Location: query. Type: string. Optional. |
| `--end-timestamp` | End timestamp to filter by Location: query. Type: string. Optional. |
| `--metric` | Metric to filter by Location: query. Type: string. Optional. Choices: duplication, countries_diversity, languages_diversity, sources_diversity, bucket_loss. Default: `"countries_diversity"`. |
| `--sampling` | Sampling to use Location: query. Type: string. Optional. Choices: 5m, 1h, 4h, 1d. Default: `"1h"`. |

### `asknews api news search-news`

Search for any news, up to the last 5 minutes or in our extensive historical archive
filled with 100s of millions of articles.

Geared toward low-latency applications, where time is of the essence. For example, this
endpoint is commonly used for quickly getting news context for an LLM.

This endpoint is also commonly used for synthetic data curation. For example, say you
are fine-tuning a model for sports. You could filter  with `classification="Sports"`
and build a dataset of sports articles.

News articles come with an abundance of valuable metadata, including full summaries, sentiment,
entities, reporting voice, page rank, language, and much much more.

An example of this data in action can be found and interacted with at `https://asknews.app/chat`

- Request: `GET /v1/news/search`
- Operation ID: `search_news`
- Safety: `read-only`

**Options:**

| Option | Description |
| --- | --- |
| `--query` | Query string that can be any phrase, keyword, question, or paragraph. If method='nl', then this will be used as a natural language query. If method='kw', then this will be used as a direct keyword query. This is not required, if it is not passed, then the search is based on the remaining filters only. Location: query. Type: string. Optional. Default: `""`. |
| `--n-articles` | Number of articles to return Location: query. Type: integer. Optional. Default: `10`. Maximum: 101. |
| `--start-timestamp` | Timestamp to start search from Location: query. Type: string. Optional. |
| `--end-timestamp` | Timestamp to end search at Location: query. Type: string. Optional. |
| `--time-filter` | Control which date type to filter on. 'crawl_date' is the date the article was crawled, 'pub_date' is the date the article was published. Location: query. Type: string. Optional. Choices: crawl_date, pub_date. Default: `"crawl_date"`. |
| `--return-type` | Type of return value. 'string' means that the return is prompt-optimized and ready to be immediately injected into any prompt. 'dicts' means that the return is a structured dictionary, containing additional metadata (like a classic news api). Can be 'string' or 'dicts', or 'both'. 'string' guarantees the lowest-latency response 'dicts' requires more I/O, therefore increases latency (very slightly, depending on your network connection). Location: query. Type: string. Optional. Choices: string, dicts, both. Default: `"dicts"`. |
| `--historical` | Search on archive of historical news. Defaults to False, meaning that the search will only look through the most recent news (48 hours) Location: query. Type: boolean. Optional. Default: `false`. |
| `--method` | Method to use for searching. 'nl' means Natural Language, which is a string that can be any phrase, keyword, question, or paragraph that will be used for semantic search on the news. 'kw' means Keyword, which can also be any keyword(s), phrase, or paragraph, however the search is a direct keyword search on the database. 'both' means both methods will be used and results will be ranked according to IRR. 'both' may reduce latency by 10 pct in exchange for improved accuracy. Location: query. Type: string. Optional. Choices: nl, kw, both. Default: `"kw"`. |
| `--similarity-score-threshold` | Similarity score threshold to determine which articles to return. Lower means less similar results are allowed. Location: query. Type: number. Optional. Default: `0.5`. |
| `--offset` | Offset for pagination. The n_articles is your page size, while your offset is the number of articles to skip to get to your page of interest. For example, if you want to get page 3 for n_article page size of 10, you would set offset to 20. Location: query. Type: string. Optional. Default: `0`. |
| `--categories` | Categories of news to filter on Location: query. Type: array<string>. Optional. |
| `--doc-start-delimiter` | Document start delimiter for string return. Location: query. Type: string. Optional. Default: `"<doc>"`. |
| `--doc-end-delimiter` | Document end delimiter for string return. Location: query. Type: string. Optional. Default: `"</doc>"`. |
| `--provocative` | Filter articles based on how provocative they are deemed based on the use of provocative language and emotional vocabulary. Location: query. Type: string. Optional. Choices: unknown, low, medium, high, all. |
| `--reporting-voice` | Type of reporting voice to filer by. Location: query. Type: string. Optional. |
| `--domain-url` | filter by domain url of interest. This can be a single domain or a list of domains. For example, 'npr.org' or ['nature.com', 'npr.org'] Location: query. Type: string. Optional. |
| `--bad-domain-url` | blacklist of domains that must be excluded from resultsThis can be a single domain url or a list of domain urls. Location: query. Type: string. Optional. |
| `--podcasts` | Control whether podcasts are included in search results. 'include' searches news and podcasts, 'only' searches podcasts only, and 'none' excludes podcasts. Location: query. Type: string. Optional. Choices: include, only, none. Default: `"include"`. |
| `--page-rank` | Maximum allowed page rank for returned articles. Location: query. Type: string. Optional. |
| `--diversify-sources` | Ensure that the return set of articles are selected from diverse sources. This adds latency to the search, but attempts to balance the representation of sources by country and source origins. In summary, a net is cast around your search, then the diversity of sources is analyzed, and your final result matches the large net diversity distribution. This means that your search accuracy is reduced, but you gain more diverse perspectives. Location: query. Type: boolean. Optional. Default: `false`. |
| `--strategy` | Strategy to use for searching. 'latest news' automatically setsmethod='nl', historical=False, and looks within the past 24 hours. 'news knowledge' automatically sets method='kw', historical=True, and looks within the past 60 days. 'news knowledge' will increase latency due to the larger search space in the archive. Use 'default' if you want to control start_timestamp, end_timestamp, historical, and method. Location: query. Type: string. Optional. Choices: latest news, news knowledge, default. Default: `"default"`. |
| `--hours-back` | Can be set to easily control the look back on the search. This is the same as controlling the 'start_timestamp' parameter. The difference is that this is not a timestamp, it is the number of hours back to look from the current time. Defaults to 24 hours. Location: query. Type: integer. Optional. Default: `24`. |
| `--string-guarantee` | If defined, the search will only occur on articles that contain strings in this list. Location: query. Type: string. Optional. |
| `--string-guarantee-op` | Operator to use for string guarantee list. Location: query. Type: string. Optional. Choices: AND, OR. Default: `"AND"`. |
| `--reverse-string-guarantee` | If defined, the search will only occur on articles that do not contain strings in this list. Location: query. Type: string. Optional. |
| `--entity-guarantee` | Entity guarantee to filter by. This is a list of strings, where each string includes entity type and entity value separated by a colon. The first element is the entity type and the second element is the entity value. For example ['Location:Paris', 'Person:John'] Location: query. Type: string. Optional. |
| `--reverse-entity-guarantee` | Reverse entity guarantee to filter by. This is a list of strings, where each string includes entity type and entity value separated by a colon. The first element is the entity type and the second element is the entity value. For example ['Location:Paris', 'Person:John'] Location: query. Type: string. Optional. |
| `--entity-guarantee-op` | Operator to use for entity guarantee list. Location: query. Type: string. Optional. Choices: AND, OR. Default: `"OR"`. |
| `--return-graphs` | Return graphs for the articles. Only available to Analyst tier and above. Location: query. Type: boolean. Optional. Default: `false`. |
| `--return-geo` | Return GeoCoordinates associated with locations discussed inside the articles. Only available to Analyst tier and above. Location: query. Type: boolean. Optional. Default: `false`. |
| `--languages` | Languages to filter by. This is the two-letter 'set 1' of the ISO 639-1 standard. For example: English is 'en'. Location: query. Type: string. Optional. |
| `--countries` | Source countries to filter by (this is only for the publisher location, not the locations mentioned in articles. For Locations mentioned in articles, refer to entity_guarantee), countries must be the two-letter ISO country codeFor example: United States is 'US', France is 'FR', Sweden is 'SE'. Location: query. Type: string. Optional. |
| `--countries-blacklist` | Source countries to blacklist from search (this is only for the publisher location, not the locations mentioned in articles. For Locations mentioned in articles, refer to reverse_entity_guarantee), countries must be the two-letter ISO country codeFor example: United States is 'US', France is 'FR', Sweden is 'SE'. Location: query. Type: string. Optional. |
| `--continents` | Continents to filter by. Location: query. Type: string. Optional. |
| `--sentiment` | Sentiment to filter articles by. Location: query. Type: string. Optional. |
| `--premium` | Include premium sources. Location: query. Type: boolean. Optional. Default: `false`. |
| `--authors` | Authors to filter articles by. Location: query. Type: string. Optional. |
| `--try-cache` | Enable response caching with the specified TTL. When a cached response is returned, usage is charged at 0.25x the normal rate. Valid values: '1h' (1 hour), '6h' (6 hours), '12h' (12 hours), '24h' (24 hours), '3d' (3 days), '7d' (7 days). Location: query. Type: string. Optional. |
| `--geo-lat` | Latitude for geo-radius filter. Must be provided together with geo_lon and geo_radius. Filters articles whose coordinates fall within the specified circle. Location: query. Type: string. Optional. |
| `--geo-lon` | Longitude for geo-radius filter. Must be provided together with geo_lat and geo_radius. Location: query. Type: string. Optional. |
| `--geo-radius` | Radius in meters for geo-radius filter. Must be provided together with geo_lat and geo_lon. Location: query. Type: string. Optional. |
| `--geo-polygon` | JSON string defining a polygon for geo filtering. Must contain an 'exterior' key with a list of {lon, lat} points. The first and last point must be the same. Optionally include 'interiors' as a list of rings (each a list of {lon, lat} points) to exclude areas. Example: {"exterior": [{"lon": -70, "lat": -70}, {"lon": 60, "lat": -70}, {"lon": 60, "lat": 60}, {"lon": -70, "lat": 60}, {"lon": -70, "lat": -70}]} Location: query. Type: string. Optional. |

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
