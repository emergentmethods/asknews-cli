import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { z } from "zod";
import type { CliConfig } from "../lib/config.js";
import { AuthError, NetworkError } from "../lib/errors.js";
import type { StoredCredential } from "./store.js";

const DiscoverySchema = z.object({
  device_authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url(),
});

const DeviceAuthorizationSchema = z.object({
  device_code: z.string(),
  user_code: z.string(),
  verification_uri: z.string().url(),
  verification_uri_complete: z.string().url().optional(),
  expires_in: z.number().positive(),
  interval: z.number().positive().default(5),
});

const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().positive().optional(),
  scope: z.string().optional(),
});

export interface DeviceLoginPrompt {
  verificationUri: string;
  userCode: string;
  expiresIn: number;
}

export interface DeviceLoginOptions {
  openBrowser: boolean;
  scopes: string[];
  onPrompt: (prompt: DeviceLoginPrompt) => void;
  signal?: AbortSignal;
}

export async function deviceLogin(
  config: CliConfig,
  options: DeviceLoginOptions,
): Promise<StoredCredential> {
  const discovery = await discover(config.authUrl, config.timeoutMs);
  const device = await postForm(discovery.device_authorization_endpoint, {
    client_id: config.oauthClientId,
    scope: options.scopes.join(" "),
  });
  const authorization = DeviceAuthorizationSchema.parse(device);
  // Open the bare verification URI rather than verification_uri_complete: the user
  // must actively enter the code printed below, which is the device flow's
  // anti-phishing check (RFC 8628 §5.4). A pre-filled code lets a logged-in user
  // approve a request they never read with a single click.
  const browserUrl = authorization.verification_uri;
  options.onPrompt({
    verificationUri: authorization.verification_uri,
    userCode: authorization.user_code,
    expiresIn: authorization.expires_in,
  });
  if (options.openBrowser) {
    openBrowser(browserUrl);
  }
  const deadline = Date.now() + authorization.expires_in * 1000;
  let intervalMs = authorization.interval * 1000;
  while (Date.now() < deadline) {
    await sleep(intervalMs, undefined, { signal: options.signal });
    const response = await fetch(discovery.token_endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: authorization.device_code,
        client_id: config.oauthClientId,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    const payload = await response.json();
    if (response.ok) {
      return toCredential(TokenSchema.parse(payload));
    }
    const code = z.object({ error: z.string() }).safeParse(payload);
    if (!code.success) {
      throw new AuthError("OAuth token response was invalid");
    }
    if (code.data.error === "authorization_pending") {
      continue;
    }
    if (code.data.error === "slow_down") {
      intervalMs += 5000;
      continue;
    }
    if (code.data.error === "access_denied") {
      throw new AuthError("OAuth login was denied");
    }
    if (code.data.error === "expired_token") {
      throw new AuthError("OAuth device code expired");
    }
    throw new AuthError(`OAuth login failed: ${code.data.error}`);
  }
  throw new AuthError("OAuth device code expired");
}

export async function refreshOAuth(
  config: CliConfig,
  refreshToken: string,
): Promise<StoredCredential> {
  const discovery = await discover(config.authUrl, config.timeoutMs);
  const payload = await postForm(discovery.token_endpoint, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.oauthClientId,
  });
  const token = TokenSchema.parse(payload);
  return toCredential({
    ...token,
    refresh_token: token.refresh_token ?? refreshToken,
  });
}

async function discover(authUrl: string, timeoutMs: number) {
  try {
    const response = await fetch(`${authUrl}/.well-known/openid-configuration`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return DiscoverySchema.parse(await response.json());
  } catch (error) {
    throw new NetworkError("Unable to discover AskNews OAuth endpoints", error);
  }
}

async function postForm(url: string, values: Record<string, string>): Promise<unknown> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(values),
    });
    const payload = await response.json();
    if (!response.ok) {
      const parsed = z.object({ error: z.string().optional() }).safeParse(payload);
      throw new AuthError(
        parsed.success && parsed.data.error
          ? `OAuth request failed: ${parsed.data.error}`
          : `OAuth request failed with HTTP ${response.status}`,
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new NetworkError("Unable to contact AskNews OAuth", error);
  }
}

function toCredential(token: z.infer<typeof TokenSchema>): StoredCredential {
  return {
    type: "oauth",
    accessToken: token.access_token,
    ...(token.refresh_token ? { refreshToken: token.refresh_token } : {}),
    ...(token.expires_in
      ? { expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString() }
      : {}),
    ...(token.scope ? { scope: token.scope } : {}),
    createdAt: new Date().toISOString(),
  };
}

function openBrowser(url: string): void {
  const command =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  const child = spawn(command[0] ?? "", command.slice(1), {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
