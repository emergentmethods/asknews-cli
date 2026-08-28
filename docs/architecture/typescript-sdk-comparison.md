# TypeScript SDK comparison

The public [`emergentmethods/asknews-typescript-sdk`](https://github.com/emergentmethods/asknews-typescript-sdk)
is a secondary request-contract reference for the CLI.

Comparison performed on 2026-06-22 against SDK commit
`7d4dc7ca43133e8a431167df74ca934beb00e5ea` (release `0.4.19`, generated from API
`0.24.66`). The CLI's pinned OpenAPI `0.24.95` remains authoritative because it is newer.

Confirmed conventions:

- SDK base path is `https://api.asknews.app` and operation paths include `/v1`; the CLI accepts a
  `/v1` base and normalizes generated paths without duplicating the prefix.
- API keys use `Authorization: Bearer <key>`.
- Web search parameters are `queries`, `lookback`, and `domains`.
- Reddit uses `keywords` and `n_threads`.
- Wikipedia uses `query` and `n_documents`.
- Stories uses `start_timestamp`, not `hours_back`; the curated CLI converts hours to a timestamp.
- DeepNews request bodies require `messages`; the curated CLI builds a user message.
- DeepNews and chat can return server-sent event streams; the CLI parses SSE data records so JSONL
  output remains structured.

Known schema evolution:

- SDK `0.24.66` uses `/v1/chat/byok/{provider}`.
- Current OpenAPI `0.24.95` uses `/v1/byok/{provider}`.

The current OpenAPI path wins. This difference demonstrates why generated coverage is pinned to the
live public schema while the SDK is used to catch ergonomic/request-construction mistakes.

