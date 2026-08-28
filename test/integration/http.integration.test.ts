import { once } from "node:events";
import { createServer } from "node:http";
import { afterEach, describe, expect, test } from "vitest";
import type { CliConfig } from "../../src/lib/config.js";
import {
  executeOperation,
  executeOperationStream,
  executeRawRequest,
  parseServerSentEvents,
} from "../../src/lib/http.js";
import type { OperationDefinition } from "../../src/lib/types.js";

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

describe("HTTP operation integration", () => {
  test("encodes path/query/body and bearer auth through a real HTTP server", async () => {
    let captured:
      | {
          method: string | undefined;
          url: string | undefined;
          authorization: string | undefined;
          body: unknown;
        }
      | undefined;
    const server = createServer(async (request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      await once(request, "end");
      captured = {
        method: request.method,
        url: request.url,
        authorization: request.headers.authorization,
        body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
      };
      response.setHeader("content-type", "application/json");
      response.end('{"ok":true}');
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "json",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 5_000,
      noColor: true,
    } satisfies CliConfig;
    const operation = {
      operationId: "test_operation",
      tag: "test",
      command: "test-operation",
      method: "POST",
      path: "/v1/things/{thing_id}",
      summary: "Test",
      parameters: [
        { name: "thing_id", location: "path", required: true, type: "string" },
        { name: "tag", location: "query", required: false, type: "array" },
      ],
      requestBody: { required: true, contentTypes: ["application/json"], schema: {} },
      safety: "read-only",
    } satisfies OperationDefinition;

    const result = await executeOperation<{ ok: boolean }>(config, "ank_secret", operation, {
      parameters: { thing_id: "a/b", tag: ["one", "two"] },
      body: { query: "energy" },
    });

    expect(result.data).toEqual({ ok: true });
    expect(captured).toEqual({
      method: "POST",
      url: "/v1/things/a%2Fb?tag=one&tag=two",
      authorization: "Bearer ank_secret",
      body: { query: "energy" },
    });
  });

  test("routes non-v1 schema paths at the API server root", async () => {
    let capturedUrl: string | undefined;
    const server = createServer((request, response) => {
      capturedUrl = request.url;
      response.setHeader("content-type", "application/json");
      response.end('{"ping":"pong"}');
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "json",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 5_000,
      noColor: true,
    } satisfies CliConfig;
    const operation = {
      operationId: "ping",
      tag: "ping",
      command: "ping",
      method: "GET",
      path: "/",
      summary: "Ping",
      parameters: [],
      requestBody: null,
      safety: "read-only",
    } satisfies OperationDefinition;

    await executeOperation(config, "ank_secret", operation, {});

    expect(capturedUrl).toBe("/");
  });

  test("parses raw requests and raises typed API failures", async () => {
    const server = createServer((request, response) => {
      response.setHeader("content-type", "application/json");
      if (request.url === "/v1/fail") {
        response.statusCode = 403;
        response.end('{"detail":"Forbidden"}');
        return;
      }
      if (request.url === "/v1/invalid") {
        response.statusCode = 422;
        response.end(
          '{"detail":[{"loc":["query","offset"],"msg":"value is not a valid integer"}]}',
        );
        return;
      }
      response.end('{"ok":true}');
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "json",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 5_000,
      noColor: true,
    } satisfies CliConfig;

    await expect(executeRawRequest(config, "ank_secret", "GET", "ok")).resolves.toMatchObject({
      data: { ok: true },
      status: 200,
    });
    await expect(executeRawRequest(config, "ank_secret", "GET", "/fail")).rejects.toMatchObject({
      message: "AskNews API returned 403: Forbidden",
      status: 403,
    });
    await expect(executeRawRequest(config, "ank_secret", "GET", "/invalid")).rejects.toMatchObject({
      message:
        'AskNews API returned 422: [{"loc":["query","offset"],"msg":"value is not a valid integer"}]',
      status: 422,
    });
  });

  test("refreshes the token and retries once after a 401, then succeeds", async () => {
    const authorizations: (string | undefined)[] = [];
    const server = createServer((request, response) => {
      authorizations.push(request.headers.authorization);
      response.setHeader("content-type", "application/json");
      if (authorizations.length === 1) {
        response.statusCode = 401;
        response.end('{"detail":"Unauthorized"}');
        return;
      }
      response.end('{"ok":true}');
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "json",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 5_000,
      noColor: true,
    } satisfies CliConfig;
    let refreshCalls = 0;
    const refresh = async () => {
      refreshCalls += 1;
      return "fresh_token";
    };

    const result = await executeRawRequest(config, "stale_token", "GET", "ok", undefined, refresh);

    expect(result).toMatchObject({ data: { ok: true }, status: 200 });
    expect(refreshCalls).toBe(1);
    expect(authorizations).toEqual(["Bearer stale_token", "Bearer fresh_token"]);
  });

  test("does not retry and surfaces the 401 when no refresh is available", async () => {
    let calls = 0;
    const server = createServer((_request, response) => {
      calls += 1;
      response.statusCode = 401;
      response.setHeader("content-type", "application/json");
      response.end('{"detail":"Unauthorized"}');
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "json",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 5_000,
      noColor: true,
    } satisfies CliConfig;

    await expect(
      executeRawRequest(config, "stale_token", "GET", "ok", undefined, async () => null),
    ).rejects.toMatchObject({
      message: "AskNews API returned 401: Unauthorized",
      status: 401,
    });
    expect(calls).toBe(1);
  });

  test("surfaces the underlying cause when the request never reaches the server", async () => {
    const server = createServer(() => {});
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    server.close();
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "json",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 5_000,
      noColor: true,
    } satisfies CliConfig;

    await expect(executeRawRequest(config, "ank_secret", "GET", "ok")).rejects.toMatchObject({
      message: expect.stringMatching(/^Request to http:\/\/127\.0\.0\.1:\d+ failed: \S/),
    });
  });

  test("reports a timeout with the configured limit instead of a bare origin", async () => {
    const server = createServer((_request, response) => {
      setTimeout(() => response.end('{"ok":true}'), 50);
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "json",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 10,
      noColor: true,
    } satisfies CliConfig;

    await expect(executeRawRequest(config, "ank_secret", "GET", "ok")).rejects.toMatchObject({
      message: expect.stringContaining("timed out after 10 ms"),
    });
  });

  test("parses server-sent events into structured records", () => {
    expect(
      parseServerSentEvents(
        'event: message\ndata: {"type":"delta","text":"hello"}\n\ndata: plain\n\ndata: [DONE]\n\n',
      ),
    ).toEqual([{ type: "delta", text: "hello" }, "plain"]);
  });

  test("delivers server-sent events incrementally", async () => {
    const server = createServer((_request, response) => {
      response.setHeader("content-type", "text/event-stream");
      response.write('data: {"delta":{"text":"hello"}}\n\n');
      setTimeout(() => {
        response.end('data: {"delta":{"text":" world"}}\n\ndata: [DONE]\n\n');
      }, 10);
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "human",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 5_000,
      noColor: true,
    } satisfies CliConfig;
    const operation = {
      operationId: "stream",
      tag: "chat",
      command: "stream",
      method: "POST",
      path: "/v1/stream",
      summary: "Stream",
      parameters: [],
      requestBody: { required: true, contentTypes: ["application/json"], schema: {} },
      safety: "high-cost",
    } satisfies OperationDefinition;
    const events: unknown[] = [];

    await executeOperationStream(
      config,
      "ank_secret",
      operation,
      { body: { stream: true } },
      (event) => events.push(event),
    );

    expect(events).toEqual([{ delta: { text: "hello" } }, { delta: { text: " world" } }]);
  });

  test("streams outlive the timeout while events keep arriving (idle timeout, not total)", async () => {
    const server = createServer((_request, response) => {
      response.setHeader("content-type", "text/event-stream");
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        response.write(`data: {"delta":{"text":"chunk ${i}"}}\n\n`);
        if (i === 5) {
          clearInterval(interval);
          response.end("data: [DONE]\n\n");
        }
      }, 40);
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "human",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 100, // total stream duration is ~200 ms; only per-chunk gaps must stay under this
      timeoutExplicit: true,
      noColor: true,
    } satisfies CliConfig;
    const operation = {
      operationId: "stream",
      tag: "chat",
      command: "stream",
      method: "POST",
      path: "/v1/stream",
      summary: "Stream",
      parameters: [],
      requestBody: { required: true, contentTypes: ["application/json"], schema: {} },
      safety: "high-cost",
    } satisfies OperationDefinition;
    const events: unknown[] = [];

    await executeOperationStream(
      config,
      "ank_secret",
      operation,
      { body: { stream: true } },
      (event) => events.push(event),
    );

    expect(events).toHaveLength(5);
  });

  test("reports a stalled stream with an actionable message instead of a bare abort", async () => {
    const server = createServer((_request, response) => {
      response.setHeader("content-type", "text/event-stream");
      response.write('data: {"delta":{"text":"hello"}}\n\n');
      // Never send another event and never end the response: the stream stalls.
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "human",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 50,
      timeoutExplicit: true,
      noColor: true,
    } satisfies CliConfig;
    const operation = {
      operationId: "stream",
      tag: "chat",
      command: "stream",
      method: "POST",
      path: "/v1/stream",
      summary: "Stream",
      parameters: [],
      requestBody: { required: true, contentTypes: ["application/json"], schema: {} },
      safety: "high-cost",
    } satisfies OperationDefinition;
    const events: unknown[] = [];

    await expect(
      executeOperationStream(config, "ank_secret", operation, { body: { stream: true } }, (event) =>
        events.push(event),
      ),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/stalled: no data received for 50 ms; raise --timeout/),
    });
    expect(events).toEqual([{ delta: { text: "hello" } }]);
  });

  test("deep_news defaults to a 15-minute timeout when none is set explicitly", async () => {
    const server = createServer((_request, response) => {
      response.setHeader("content-type", "application/json");
      setTimeout(() => response.end('{"ok":true}'), 100);
    });
    servers.push(server);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing server address");
    const config = {
      apiUrl: `http://127.0.0.1:${address.port}/v1`,
      authUrl: "http://auth.invalid",
      oauthClientId: "test",
      output: "json",
      configDir: "/tmp/asknews-cli-integration",
      timeoutMs: 10, // ignored for deep_news because it was not set explicitly
      timeoutExplicit: false,
      noColor: true,
    } satisfies CliConfig;
    const operation = {
      operationId: "deep_news",
      tag: "chat",
      command: "deepnews",
      method: "POST",
      path: "/v1/chat/deepnews",
      summary: "DeepNews",
      parameters: [],
      requestBody: { required: true, contentTypes: ["application/json"], schema: {} },
      safety: "high-cost",
    } satisfies OperationDefinition;

    await expect(
      executeOperation(config, "ank_secret", operation, { body: { query: "energy" } }),
    ).resolves.toMatchObject({ data: { ok: true } });

    const explicit = { ...config, timeoutExplicit: true } satisfies CliConfig;
    await expect(
      executeOperation(explicit, "ank_secret", operation, { body: { query: "energy" } }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("timed out after 10 ms"),
    });
  });
});
