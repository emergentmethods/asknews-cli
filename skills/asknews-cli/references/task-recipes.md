# AskNews task recipes

Load only the section relevant to the current task. Confirm advanced flags with the installed
command's `--help` because OpenAPI-derived options can evolve.

## Article retrieval

Start with structured, narrow retrieval:

```bash
asknews news search "query" --limit 5 --output json
```

For recent coverage:

```bash
asknews news search "query" \
  --hours-back 24 \
  --limit 5 \
  --output json
```

For a specific window:

```bash
asknews news search "query" \
  --start-datetime 2026-01-01T00:00:00Z \
  --end-datetime 2026-01-31T00:00:00Z \
  --limit 10 \
  --output json
```

The query is a semantic search where keywords are prioritized. Use `--string-guarantee` or
`--entity-guarantee` when a keyword or entity must be present, and `--reverse-string-guarantee` to
exclude a name or concept. Apply date, language, country, domain, entity, or string filters only
when justified by the task; inspect `asknews news search --help` for exact syntax and current
enums. Advanced parameters not exposed here (search method, strategy, geo filters, caching) remain
available on `asknews api news search-news`.

When answering from articles:

- Prefer publication date over crawl date when discussing chronology.
- Do not treat multiple syndicated copies as independent confirmation.
- Preserve URLs and source names for citations.
- State the search window when freshness matters.

## Stories and event tracking

Use stories for event-level context:

```bash
asknews stories list --query "event" --limit 5 --output json
asknews stories get STORY_ID --output json
```

Start from the list, choose the relevant story by title/summary/date, then fetch details only when
updates or underlying context are needed. Use `--sort-by relevance` for a query and time/coverage
sorting for broad monitoring. Confirm sort values with `asknews stories list --help`.

Do not confuse a story update timestamp with the publication time of every underlying article.

## DeepNews research

Use DeepNews for analysis or synthesis, not as the default retrieval mechanism:

```bash
asknews research "question" --output json
```

Discover models available to the current account rather than assuming access:

```bash
asknews research models --output json
```

Select multiple sources with repeated options:

```bash
asknews research "Compare current policy reactions" \
  --sources asknews \
  --sources reddit \
  --return-sources true \
  --output json
```

For incremental processing:

```bash
asknews research "question" --stream true --output jsonl
```

Keep default depth for an initial answer. Increase search/depth parameters only when the user wants
more exhaustive research and accepts the added time/cost. Preserve returned citations. Do not claim
that model-generated synthesis is itself a primary source.

## Web, Reddit, Wikipedia, and X

```bash
asknews web "query" --output json
asknews reddit "query" --output json
asknews wiki "query" --output json
asknews x "expression" --lookback 24 --output json
```

Use web for live non-news pages, Reddit for community discussion, Wikipedia for background, and x
for X (Twitter) posts. The x command takes a Twitter Advanced Search expression (`from:username`,
`#hashtag`, `min_faves:N`, `AND`/`OR`; see `asknews x --help`), and paginates by passing
`response.offset` back via `--offset`. Label community claims as opinions or reports unless
independently verified. For current factual claims, prefer corroboration from article search or
primary sources returned by the tool.

## Generated API operations

Discover rather than memorize:

```bash
asknews api list --output json
asknews api list --tag TAG --output json
asknews api list --safety read-only --output json
asknews api GROUP OPERATION --help
```

Then invoke the generated command using documented flags:

```bash
asknews api news search-news \
  --query "query" \
  --n-articles 5 \
  --output json
```

For a request body, prefer schema-derived body flags. Use `--body @file.json` when the body is
complex and already exists as a reviewed file. Do not create a credential-bearing body file.

Use `asknews request METHOD PATH` only if `api list` confirms there is no suitable generated
operation. Keep paths relative to the configured `/v1` API base.

## Alerts and other mutations

Listing or inspecting existing resources is read-only:

```bash
asknews alerts list --output json
```

Before any create/update/delete/run/send operation:

1. Run its `--help`.
2. Determine whether it is mutating or high-cost.
3. Show the user the target, material parameters, and effect.
4. Obtain clear authorization.
5. Execute once with structured output and the required `--yes`.
6. Report the returned resource ID/status without exposing credentials.

If the outcome is ambiguous after a timeout, inspect the resource before retrying. Blind retries can
duplicate resources or charges.

## Reporting results

For factual research, include:

- the answer or synthesis;
- the exact time window when relevant;
- source names and links/citations;
- material disagreement or uncertainty;
- whether the result came from retrieval, a story cluster, community discussion, or DeepNews
  synthesis.

Avoid presenting the current date as the article date, treating relevance order as chronology, or
claiming completeness from a small result limit.
