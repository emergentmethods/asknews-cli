# Architecture

The CLI has one request engine and two command layers:

```text
OpenAPI snapshot ──► generated operation manifest ──► generated `asknews api` commands
                                                     ▲
curated commands ────────────────────────────────────┘
                                                     │
flags/env/stored auth ──► request builder ──► API ──► output formatter
```

Generated commands guarantee coverage of all customer-facing OpenAPI operations. Curated commands
provide intentional names, defaults, validation, and human rendering for common workflows without
forking request behavior.

Authentication precedence is explicit command API key, `ASKNEWS_API_KEY`, stored renewable OAuth,
then stored API key. OAuth uses the issuer's device authorization grant and stores renewable tokens
under the user config directory with restricted permissions. API keys and access tokens are both
sent to the gateway as bearer credentials.

Human output is selected only for a TTY unless explicitly requested. It projects nested AskNews
records into domain-specific article, story, model, and alert tables; `table` forces tabular list
output. JSON, JSONL, and YAML are stable data formats; diagnostics always use stderr.

OpenAPI query parameters and request-body properties share one option generator. Curated commands
exclude only fields replaced by intentional positional arguments or aliases, and contract tests
prove the remaining schema fields are exposed. SSE responses are decoded incrementally. Human
streaming writes text deltas immediately; JSONL streaming emits complete event objects.
