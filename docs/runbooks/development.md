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

See [Schema refresh](schema-refresh.md) for generated-contract review and
[Private release preparation](release.md) for package verification and approval boundaries.
