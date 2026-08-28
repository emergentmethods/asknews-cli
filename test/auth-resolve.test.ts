import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { resolveCredential } from "../src/auth/resolve.js";
import { CredentialStore } from "../src/auth/store.js";
import type { CliConfig } from "../src/lib/config.js";

async function config(apiKey?: string): Promise<CliConfig> {
  return {
    apiUrl: "https://api.example/v1",
    authUrl: "https://auth.example",
    oauthClientId: "asknews-cli",
    output: "json",
    configDir: await mkdtemp(join(tmpdir(), "asknews-auth-")),
    ...(apiKey ? { apiKey } : {}),
    timeoutMs: 5_000,
    noColor: true,
  };
}

describe("credential resolution", () => {
  test("prefers an explicit or environment API key", async () => {
    await expect(resolveCredential(await config("ank_env"))).resolves.toEqual({
      token: "ank_env",
      source: "flag-or-env",
    });
  });

  test("loads a stored API key", async () => {
    const value = await config();
    await new CredentialStore(value.configDir).write({
      type: "api_key",
      apiKey: "ank_stored",
      createdAt: new Date().toISOString(),
    });
    await expect(resolveCredential(value)).resolves.toEqual({
      token: "ank_stored",
      source: "stored-api-key",
    });
  });

  test("loads a non-expired OAuth token", async () => {
    const value = await config();
    await new CredentialStore(value.configDir).write({
      type: "oauth",
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    const resolved = await resolveCredential(value);
    expect(resolved).toMatchObject({ token: "access", source: "stored-oauth" });
    expect(typeof resolved.refresh).toBe("function");
  });

  test("rejects absent and expired non-renewable credentials", async () => {
    const absent = await config();
    await expect(resolveCredential(absent)).rejects.toThrow("Not authenticated");
    const expired = await config();
    await new CredentialStore(expired.configDir).write({
      type: "oauth",
      accessToken: "expired",
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    await expect(resolveCredential(expired)).rejects.toThrow("expired");
  });

  test("refreshes and persists an expired OAuth token", async () => {
    const value = await config();
    await new CredentialStore(value.configDir).write({
      type: "oauth",
      accessToken: "expired",
      refreshToken: "refresh",
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      createdAt: new Date().toISOString(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        if (String(input).includes(".well-known")) {
          return new Response(
            JSON.stringify({
              device_authorization_endpoint: "https://auth.example/device",
              token_endpoint: "https://auth.example/token",
            }),
            { headers: { "content-type": "application/json" } },
          );
        }
        return new Response('{"access_token":"renewed","refresh_token":"next","expires_in":3600}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const resolved = await resolveCredential(value);
    expect(resolved).toMatchObject({ token: "renewed", source: "stored-oauth" });
    expect(typeof resolved.refresh).toBe("function");
    await expect(new CredentialStore(value.configDir).read()).resolves.toMatchObject({
      type: "oauth",
      accessToken: "renewed",
      refreshToken: "next",
    });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
