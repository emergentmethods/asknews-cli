# Live testing

Live tests are opt-in and never run in the default suite. They target the API URL in
`ASKNEWS_API_URL` (default `https://api.asknews.app/v1`) using the key in `ASKNEWS_LIVE_API_KEY`.

```bash
ASKNEWS_LIVE_TESTS=1 \
ASKNEWS_LIVE_API_KEY=... \
pnpm test:live
```

Rules:

- The default test suite makes no AskNews network calls.
- Credentials are read from the environment and never printed or snapshotted.
- The basic live suite uses an explicit read-only, low-cost allowlist.
- Mutating tests additionally require `ASKNEWS_LIVE_MUTATIONS=1`.
- High-cost tests additionally require `ASKNEWS_LIVE_EXPENSIVE=1`.
- Test failures must redact bearer values and request headers.
