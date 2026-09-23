---
title: api profile
description: Generated profile API operations
---

# api profile

Generated from AskNews API 0.32.1.

## Operations

### `asknews api profile get-rate-limit-status`

Return the caller's current rate-limit and concurrency-limit state without consuming any tokens.

- Request: `GET /v1/profiles/me/limits`
- Operation ID: `get_rate_limit_status`
- Safety: `read-only`

### `asknews api profile get-user-profile`

Get the current profile

- Request: `GET /v1/profiles/me`
- Operation ID: `get_user_profile`
- Safety: `read-only`

## Global options

All commands support `--output human|table|json|jsonl|yaml`, `--json`, API/auth URL
overrides, request timeout, and color control. Result data is written to stdout; diagnostics
are written to stderr.
