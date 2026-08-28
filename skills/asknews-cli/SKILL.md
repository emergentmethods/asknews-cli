---
name: asknews-cli
description: Use the AskNews CLI for current or historical news retrieval, story tracking, multi-source DeepNews research, web/Reddit/Wikipedia/X search, alerts, and any customer-facing AskNews API operation. Use when an agent needs sourced real-world information, news context, structured AskNews data, or safe AskNews automation.
---

# AskNews CLI

Use `asknews` instead of constructing HTTP requests. The CLI handles authentication, schema-derived
parameters, API errors, output formats, and mutation safeguards.

## Workflow

1. Verify availability with `asknews --version`. If it is missing, tell the user how to install it;
   do not invent an API fallback.
2. Check credentials with `asknews auth status --offline --output json`. Never display credentials.
3. Select the narrowest command family that answers the request.
4. For unfamiliar or advanced options, run that command's `--help` before execution. The installed
   help is authoritative because it is generated from the current OpenAPI schema.
5. Start with a small result set, inspect structured output, then broaden only when needed.
6. Report the answer with dates and source provenance. Distinguish retrieved facts from your own
   synthesis.

## Select the command

| Need | Use |
| --- | --- |
| Individual current or historical articles | `asknews news search` |
| Clustered narratives and evolving events | `asknews stories list`, then `stories get` |
| A synthesized answer across multiple sources | `asknews research` |
| Live web, Reddit, Wikipedia, or X (Twitter) context | `asknews web`, `asknews reddit`, `asknews wiki`, `asknews x` |
| Existing monitoring configuration | `asknews alerts` |
| A less common public API capability | `asknews api list`, then a generated command |
| An API path with no generated command | `asknews request` as a last resort |

Use article search when the user needs evidence or a source set. Use stories when they need the
shape and development of an event. Use DeepNews only when synthesis is requested or materially
useful; it is slower and potentially more expensive than retrieval.

## Output and context discipline

- Use `--output json` for agent inspection and transformation.
- Use `--output jsonl` with `--stream` when incremental DeepNews events are useful.
- Use human/table output only for a person reading the terminal.
- Result data is on stdout; diagnostics are on stderr. Do not parse diagnostics as data.
- Begin with `--limit 5` for article or story discovery unless the user requests broader coverage.
- Prefer exact UTC timestamps or explicit lookback windows for time-sensitive work.
- Preserve source names, URLs, publication dates, article/story IDs, and citations needed to audit
  the answer. Do not paste the entire raw response when a concise synthesis is enough.
- If results are empty or weak, say so; adjust one search dimension at a time rather than silently
  presenting unrelated results.

## Discovery

```bash
asknews <command> --help
asknews api list --output json
asknews api list --tag news --output json
asknews api list --safety high-cost --output json
asknews api <group> <operation> --help
```

Generated flags use kebab-case: OpenAPI `start_timestamp` becomes `--start-timestamp`. Use
schema-derived flags first and repeat array options when documented. Use `--param name=value` only
as an escape hatch.

Read [references/task-recipes.md](references/task-recipes.md) when the task needs advanced news
filters, research tuning, source-specific search, generated API operations, or mutations. Do not
load it for a straightforward search.

For exact command arguments and options, read
[references/commands/index.md](references/commands/index.md), then load only the relevant route
reference. These files are generated from the same Commander/OpenAPI metadata as `--help`.

## Authentication, cost, and safety

- Prefer OAuth for people and `ASKNEWS_API_KEY` for CI/agents. Avoid `--api-key` because command-line
  arguments can appear in process listings and shell history.
- If credentials are absent, ask the user to run `asknews auth login` or configure
  `ASKNEWS_API_KEY`; never request that they paste a secret into chat.
- Treat historical search, DeepNews, web search, graph, forecast, and explicitly labeled high-cost
  operations as billable. Keep scope narrow and do not automatically retry chargeable failures.
- Read-only retrieval may proceed when it directly answers the request. Creating, updating,
  deleting, sending, running, or triggering a resource requires clear user authorization.
- Before a mutation, inspect operation help, summarize the intended effect, and use `--yes` only
  after authorization. Never infer permission from access to credentials.

## Failure handling

- Unknown option or validation error: inspect the exact command's `--help`; do not guess enum values.
- `401`: authentication is absent or expired; recheck `auth status`.
- `403`: the account or plan may not permit the operation; do not evade the restriction.
- `429`: report rate limiting and respect retry guidance; do not loop aggressively.
- Timeout or transient server error: retry read-only work at most once unless the user asks for
  persistence. Do not automatically retry mutations or expensive research.
