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

## Request timeouts

The default request timeout is 60,000 ms, or 900,000 ms (15 minutes) for DeepNews research.
`--timeout` takes precedence over `ASKNEWS_TIMEOUT_MS`; either explicit setting overrides the
operation default, including shorter or longer research budgets.

- **Buffered responses:** one deadline per HTTP attempt covers waiting for headers and reading
  the entire body. Body chunks do not restart this deadline. The transport's headers timeout and
  body **inactivity** timeout are also set to the effective budget; body inactivity alone is not
  a total-duration limit. There is no separate five-minute headers/body cap.
- **SSE responses:** the same effective timeout bounds the initial wait and inactivity between
  received chunks, including comment-only heartbeats. Activity resets the idle timer, so a healthy
  stream can outlive the timeout. A non-SSE fallback is buffered under the existing idle signal.
- **Transport:** a request-scoped Undici dispatcher interceptor sets finite request-level
  headers/body timers after native fetch supplies its options, avoiding dependence on whether a
  Node version supplies request-level values that override Agent defaults. Connection protections
  remain at Undici defaults. No process-wide timeout is reconfigured.
- **Retries and cleanup:** network timeouts do not trigger retries. The existing single OAuth
  refresh retry after a 401 remains; its buffered retry gets a fresh per-attempt budget, and token
  refresh has its own timeout. Thus this is not one wall-clock cap across authentication and
  multiple attempts. An unused 401 body is cancelled before retrying. Request timers, SSE readers,
  and the scoped dispatcher's connections are cleaned up on success and failure.

Timeouts and transport failures remain network errors (exit 4), distinct from API refusals
(exit 5 for 4xx, exit 6 for 5xx). A timeout cannot establish whether the server continued work;
retrying an expensive operation manually may incur another charge.
