# Development

```bash
pnpm install
pnpm sync:openapi
pnpm check
pnpm build
node dist/bin.js --help
```

`pnpm sync:openapi` downloads the schema selected by `ASKNEWS_SCHEMA_URL` (production by default),
writes the deterministic generated manifest, regenerates command documentation, formats it, runs
the schema/help contracts, and rebuilds the executable. Review all generated diffs.

Package installation writes the embedded skill under detected agent directories. Set
`ASKNEWS_NO_AGENT_SKILLS=1` to opt out or `ASKNEWS_AGENT_HOME=/controlled/home` to choose the agent
home explicitly. Package managers may sanitize lifecycle environments; for a controlled package
install use `npm_config_asknews_agent_home=/controlled/home`.

## Local timeout regression checks

`pnpm check` includes deterministic loopback HTTP tests for dispatched timeout values, total
buffered deadlines, body stalls, SSE heartbeat/idle handling, error types, and cleanup. These
short tests do not claim to wait through the actual five-minute transport boundary.

For the optional real wall-clock proof (about 305 seconds, loopback only, no credentials or
billable API calls), allow at least 360 seconds in your outer process runner:

```bash
ASKNEWS_LOCAL_TIMEOUT_SMOKE=1 pnpm exec vitest run test/integration/http-timeout.integration.test.ts -t wall-clock
```

The smoke compares native fetch with default transport timers (300 seconds)
against the CLI's request-scoped dispatcher for both delayed headers and a delayed body. It prints
runtime versions and measured elapsed times. The fixed calls retain the default 900-second
research budget. Use `pnpm build:bundle` for a local build from the committed schema without
refreshing generated API contracts.

See [Schema refresh](schema-refresh.md) for generated-contract review and
[Private release preparation](release.md) for package verification and approval boundaries.
