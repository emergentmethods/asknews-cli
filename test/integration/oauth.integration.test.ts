import { once } from "node:events";
import { createServer } from "node:http";
import { afterEach, describe, expect, test } from "vitest";
import { deviceLogin } from "../../src/auth/oauth.js";
import type { CliConfig } from "../../src/lib/config.js";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
  servers.length = 0;
});

describe("OAuth device flow integration", () => {
  test("discovers, starts, polls, and returns a renewable credential", async () => {
    let polls = 0;
    let origin = "";
    const server = createServer((request, response) => {
      response.setHeader("content-type", "application/json");
      if (request.url === "/.well-known/openid-configuration") {
        response.end(
          JSON.stringify({
            device_authorization_endpoint: `${origin}/device`,
            token_endpoint: `${origin}/token`,
          }),
        );
        return;
      }
      if (request.url === "/device") {
        response.end(
          JSON.stringify({
            device_code: "device-code",
            user_code: "ABCD-EFGH",
            verification_uri: `${origin}/verify`,
            expires_in: 30,
            interval: 0.01,
          }),
        );
        return;
      }
      if (request.url === "/token") {
        polls += 1;
        if (polls === 1) {
          response.statusCode = 400;
          response.end('{"error":"authorization_pending"}');
          return;
        }
        response.end(
          '{"access_token":"access","refresh_token":"refresh","expires_in":3600,"scope":"openid news"}',
        );
        return;
      }
      response.statusCode = 404;
      response.end("{}");
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    origin = `http://127.0.0.1:${address.port}`;
    const config = {
      apiUrl: "http://api.invalid/v1",
      authUrl: origin,
      oauthClientId: "asknews-cli",
      output: "json",
      configDir: "/tmp/asknews-cli-oauth",
      timeoutMs: 5_000,
      noColor: true,
    } satisfies CliConfig;
    const prompts: unknown[] = [];

    const credential = await deviceLogin(config, {
      openBrowser: false,
      scopes: ["openid", "news"],
      onPrompt: (prompt) => prompts.push(prompt),
    });

    expect(credential).toMatchObject({
      type: "oauth",
      accessToken: "access",
      refreshToken: "refresh",
      scope: "openid news",
    });
    expect(prompts).toEqual([
      { verificationUri: `${origin}/verify`, userCode: "ABCD-EFGH", expiresIn: 30 },
    ]);
    expect(polls).toBe(2);
  });
});
