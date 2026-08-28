# 0002 — OAuth and credential storage

**Status:** Accepted · **Date:** 2026-06-22 · **Supersedes / Superseded by:** —

## Context

Interactive users need OAuth login; scripts and agents need API keys. A distributed CLI cannot
securely embed a confidential OAuth client secret. The AskNews OIDC discovery document advertises
device authorization, refresh tokens, public token authentication, and PKCE.

## Options considered

1. **API keys only:** simple and robust, but does not satisfy interactive login.
2. **Authorization code with a bundled secret:** familiar browser flow, but a shipped secret is not secret.
3. **Public-client device flow:** designed for CLIs, works without a callback listener or client secret,
   and supports refresh tokens; requires a registered public client.
4. **Delegate login through the MCP proxy:** reuses a confidential server client but couples the CLI to
   MCP token brokering and introduces another network dependency.

## Decision

Use OAuth 2.0 device authorization with a registered public CLI client and refresh tokens. Also
support explicit/environment/stored API keys. Store credentials in a mode-0700 directory and
mode-0600 file, redact secrets everywhere, and allow config-directory override for tests.

## Token refresh

OAuth access tokens are refreshed two ways: **proactively** (a stored token within 60s of its
`expiresAt` is refreshed before the request) and **reactively** (a `401` from the API triggers one
refresh-and-retry, covering tokens revoked before their stated expiry). The reactive retry runs once;
if no refresh token is stored or the refresh fails, the original `401` is surfaced unchanged. API-key
and flag/env credentials are never refreshed.

## Consequences

AskNews auth operations must register and maintain a public CLI client. The implementation remains
configurable so development and self-hosted issuers can supply a different client ID. MCP changes
are unnecessary unless auth deployment constraints prevent direct public-client device flow.

