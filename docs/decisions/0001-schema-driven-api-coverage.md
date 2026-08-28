# 0001 — Schema-driven API coverage

**Status:** Accepted · **Date:** 2026-06-22 · **Supersedes / Superseded by:** —

## Context

The CLI must cover every customer-facing public API operation and remain synchronized as the API
evolves. Handwriting dozens of commands would create silent drift; exposing only a generic request
command would technically reach the API but fail the discoverability and agent-usage requirements.

## Options considered

1. **Handwritten commands only:** best individual UX, but expensive and structurally prone to drift.
2. **Generic HTTP escape hatch only:** complete transport access, but poor discovery, validation, and help.
3. **Generated operation commands plus curated adapters:** measurable full coverage and intentional UX
   where it matters, at the cost of a generator and pinned schema artifact.

## Decision

Use generated commands for every customer-facing OpenAPI operation, a generic request escape hatch,
and curated adapters for common workflows. Contract tests compare the generated manifest to the
pinned schema and fail on omissions, duplicates, or unsafe metadata gaps.

## Consequences

The public OpenAPI schema is now a CLI compatibility input. Schema refreshes produce reviewable
generated diffs and command-reference changes. Curated commands must delegate to the operation
executor rather than implement independent HTTP calls.

