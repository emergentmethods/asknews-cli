import type { CliConfig } from "../lib/config.js";
import { AuthError } from "../lib/errors.js";
import type { TokenRefresher } from "../lib/types.js";
import { refreshOAuth } from "./oauth.js";
import { CredentialStore, type StoredCredential } from "./store.js";

export interface ResolvedCredential {
  token: string;
  source: "flag-or-env" | "stored-api-key" | "stored-oauth";
  // Set only for stored OAuth sessions: forces a token refresh so the HTTP layer can retry a 401.
  refresh?: TokenRefresher;
}

export async function resolveCredential(config: CliConfig): Promise<ResolvedCredential> {
  if (config.apiKey) {
    return { token: config.apiKey, source: "flag-or-env" };
  }
  const store = new CredentialStore(config.configDir);
  const stored = await store.read();
  if (!stored) {
    throw new AuthError("Not authenticated. Run `asknews auth login` or set ASKNEWS_API_KEY.");
  }
  if (stored.type === "api_key") {
    return { token: stored.apiKey, source: "stored-api-key" };
  }
  const credential = await renewableCredential(config, stored, store);
  return {
    token: credential.accessToken,
    source: "stored-oauth",
    refresh: () => forceRefresh(config),
  };
}

// Refresh against the latest stored refresh token (it may have rotated) and persist the result.
// Returns null when the session can no longer be refreshed; the caller then surfaces the 401.
async function forceRefresh(config: CliConfig): Promise<string | null> {
  const store = new CredentialStore(config.configDir);
  const stored = await store.read();
  if (stored?.type !== "oauth" || !stored.refreshToken) {
    return null;
  }
  const refreshed = await refreshOAuth(config, stored.refreshToken);
  if (refreshed.type !== "oauth") {
    return null;
  }
  await store.write(refreshed);
  return refreshed.accessToken;
}

async function renewableCredential(
  config: CliConfig,
  credential: Extract<StoredCredential, { type: "oauth" }>,
  store: CredentialStore,
): Promise<Extract<StoredCredential, { type: "oauth" }>> {
  if (!credential.expiresAt || Date.parse(credential.expiresAt) > Date.now() + 60_000) {
    return credential;
  }
  if (!credential.refreshToken) {
    throw new AuthError("Stored OAuth session expired. Run `asknews auth login` again.");
  }
  const refreshed = await refreshOAuth(config, credential.refreshToken);
  if (refreshed.type !== "oauth") {
    throw new AuthError("OAuth refresh returned an invalid credential");
  }
  await store.write(refreshed);
  return refreshed;
}
