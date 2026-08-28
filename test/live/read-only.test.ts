import { describe, expect, test } from "vitest";
import type { CliConfig } from "../../src/lib/config.js";
import { executeOperation } from "../../src/lib/http.js";
import { getOperation } from "../../src/lib/operations.js";

const enabled = process.env.ASKNEWS_LIVE_TESTS === "1";
const apiUrl = process.env.ASKNEWS_API_URL ?? "https://api.asknews.app/v1";
const authUrl = process.env.ASKNEWS_AUTH_URL ?? "https://auth.asknews.app";
const token = process.env.ASKNEWS_LIVE_API_KEY ?? "";

describe.skipIf(!enabled)("live read-only checks", () => {
  test("API key can read its profile and limits", async () => {
    expect(token, "ASKNEWS_LIVE_API_KEY is required").toBeTruthy();
    for (const path of ["/profiles/me", "/profiles/me/limits"]) {
      const response = await fetch(`${apiUrl}${path}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(200);
    }
  });

  test("API key can execute a public API operation through the CLI request engine", async () => {
    expect(token, "ASKNEWS_LIVE_API_KEY is required").toBeTruthy();
    const config = {
      apiUrl,
      authUrl,
      oauthClientId: "asknews-cli",
      output: "json",
      configDir: "/tmp/asknews-cli-live",
      timeoutMs: 30_000,
      noColor: true,
    } satisfies CliConfig;
    const response = await executeOperation(config, token, getOperation("list_deepnews_models"), {
      parameters: {},
    });
    expect(response.status).toBe(200);
    expect(response.data).toBeTruthy();
  });
});
