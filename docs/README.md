# Docs — asknews-cli

Documentation for the AskNews CLI.

| Section | What lives here |
| --- | --- |
| [architecture/](architecture/) | CLI, request, authentication, and generation architecture |
| [commands/](commands/) | Generated per-command reference |
| [runbooks/](runbooks/) | Repeatable development, testing, generation, and release procedures |
| [decisions/](decisions/) | Numbered architecture decisions |

## Key entry points

- [Architecture](architecture/overview.md) — request, auth, output, and generation flow.
- [TypeScript SDK comparison](architecture/typescript-sdk-comparison.md) — secondary request-contract audit.
- [Development runbook](runbooks/development.md) — local setup and verification.
- [Schema refresh](runbooks/schema-refresh.md) — generated-contract review.
- [Live testing](runbooks/live-testing.md) — credential and spending safeguards.
- [Release](runbooks/release.md) — package checks and the GitHub/npm release process.
