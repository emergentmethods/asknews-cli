# 0003 — Output and agent contract

**Status:** Accepted · **Date:** 2026-06-22 · **Supersedes / Superseded by:** —

## Context

Humans need concise, attractive terminal output. Scripts and agents need deterministic data without
ANSI escapes, prompts, spinners, or diagnostics mixed into stdout.

## Options considered

1. **Human text only:** attractive but brittle for automation.
2. **JSON only:** deterministic but poor interactive ergonomics.
3. **Mode-aware output contract:** human rendering by default on TTY, explicit table/JSON/JSONL/YAML,
   incremental human/JSONL streaming, and strict stdout/stderr separation.

## Decision

Adopt the mode-aware contract. Human mode uses domain-specific tables for list/search results and
`table` forces tabular output. Structured modes return only result data on stdout. Streaming emits
text immediately in human mode or event objects in JSONL. Diagnostics and progress use stderr.
Non-TTY execution never prompts without an explicit interactive command. Errors have stable typed
exit codes. The embedded skill directs agents to structured output.

## Consequences

Formatting and error behavior require snapshot and contract tests. Every new command must return
data through the central renderer and avoid direct mixed console output.
