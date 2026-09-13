import { channel } from "node:diagnostics_channel";
import { once } from "node:events";
import { createServer, type RequestListener, type ServerResponse } from "node:http";
import type { Socket } from "node:net";
import { Agent } from "undici";
import { afterEach, expect, test, vi } from "vitest";
import type { CliConfig } from "../../src/lib/config.js";
import { executeOperation, executeOperationStream, executeRawRequest } from "../../src/lib/http.js";
import type { OperationDefinition } from "../../src/lib/types.js";

const cleanups: (() => void | Promise<void>)[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.reverse()) await cleanup();
  cleanups.length = 0;
  vi.unstubAllGlobals();
});

const research: OperationDefinition = {
  operationId: "deep_news",
  tag: "chat",
  command: "deepnews",
  method: "POST",
  path: "/v1/chat/deepnews",
  summary: "DeepNews",
  parameters: [],
  requestBody: { required: true, contentTypes: ["application/json"], schema: {} },
  safety: "high-cost",
};

async function localServer(handler: RequestListener) {
  const sockets = new Set<Socket>();
  const server = createServer(handler);
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  cleanups.push(
    () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  );
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing server address");
  const config: CliConfig = {
    apiUrl: `http://127.0.0.1:${address.port}/v1`,
    authUrl: "http://auth.invalid",
    oauthClientId: "test",
    output: "json",
    configDir: "/tmp/asknews-cli-timeout-test",
    timeoutMs: 60_000,
    noColor: true,
  };
  return { config, sockets };
}

function later(response: ServerResponse, ms: number, action: () => void) {
  const timer = setTimeout(action, ms);
  response.on("close", () => clearTimeout(timer));
}

function ticks(response: ServerResponse, ms: number, action: () => void) {
  const timer = setInterval(action, ms);
  response.on("close", () => clearInterval(timer));
}

function observeTimeouts(config: CliConfig) {
  const requests: { headersTimeout: number; bodyTimeout: number }[] = [];
  const diagnostics = channel("undici:request:create");
  const observe = (message: unknown) => {
    const { request } = message as {
      request: {
        origin: string;
        headersTimeout: number;
        bodyTimeout: number;
      };
    };
    if (String(request.origin) === new URL(config.apiUrl).origin) {
      requests.push({ headersTimeout: request.headersTimeout, bodyTimeout: request.bodyTimeout });
    }
  };
  diagnostics.subscribe(observe);
  cleanups.push(() => diagnostics.unsubscribe(observe));
  return requests;
}

test("native fetch dispatches the effective finite budget, not the transport defaults", async () => {
  const { config } = await localServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    later(response, 30, () => response.end('{"ok":true}'));
  });
  const dispatched = observeTimeouts(config);
  await executeOperation(config, "test", research, {});
  await executeOperation(
    { ...config, timeoutMs: 1_200_000, timeoutExplicit: true },
    "test",
    research,
    {},
  );
  await executeOperation(
    { ...config, timeoutMs: 1_000, timeoutExplicit: true },
    "test",
    research,
    {},
  );
  await executeOperation(config, "test", { ...research, operationId: "other" }, {});
  await executeRawRequest(config, "test", "GET", "/raw");
  expect(dispatched).toEqual(
    [900_000, 1_200_000, 1_000, 60_000, 60_000].map((ms) => ({
      headersTimeout: ms,
      bodyTimeout: ms,
    })),
  );
});

test("buffered deadline includes delayed headers and the entire body; chunks do not extend it", async () => {
  let calls = 0;
  const { config, sockets } = await localServer((_request, response) => {
    calls++;
    later(response, 150, () => {
      response.setHeader("content-type", "application/json");
      response.write("[");
      ticks(response, 40, () => response.write("0,"));
    });
  });
  const start = performance.now();
  await expect(
    executeOperation({ ...config, timeoutMs: 350, timeoutExplicit: true }, "test", research, {}),
  ).rejects.toMatchObject({
    exitCode: 4,
    message: expect.stringContaining("timed out after 350 ms"),
  });
  expect(performance.now() - start).toBeLessThan(1_500);
  expect(calls).toBe(1);
  await vi.waitFor(() => expect(sockets.size).toBe(0));
});

test.each([
  "headers",
  "body",
])("a silent %s wait expires with the explicit research deadline", async (phase) => {
  const { config, sockets } = await localServer((_request, response) => {
    if (phase === "body") {
      response.setHeader("content-type", "application/json");
      response.write('{"ok":');
    }
  });
  await expect(
    executeOperation({ ...config, timeoutMs: 150, timeoutExplicit: true }, "test", research, {}),
  ).rejects.toMatchObject({
    exitCode: 4,
    message: expect.stringContaining("timed out after 150 ms"),
  });
  await vi.waitFor(() => expect(sockets.size).toBe(0));
});

test("a delayed body within the remaining total budget completes and closes its socket", async () => {
  const { config, sockets } = await localServer((_request, response) => {
    later(response, 50, () => {
      response.setHeader("content-type", "application/json");
      response.write('{"ok":');
      later(response, 100, () => response.end("true}"));
    });
  });
  await expect(
    executeOperation({ ...config, timeoutMs: 500, timeoutExplicit: true }, "test", research, {}),
  ).resolves.toMatchObject({ data: { ok: true } });
  await vi.waitFor(() => expect(sockets.size).toBe(0));
});

test("SSE comment heartbeats extend activity beyond the idle budget without emitting events", async () => {
  const { config, sockets } = await localServer((_request, response) => {
    response.setHeader("content-type", "text/event-stream");
    response.write(": heartbeat\n\n");
    ticks(response, 40, () => response.write(": heartbeat\n\n"));
    later(response, 500, () => response.end('data: {"ok":true}\n\ndata: [DONE]\n\n'));
  });
  const dispatched = observeTimeouts(config);
  const events: unknown[] = [];
  await executeOperationStream(
    { ...config, timeoutMs: 200, timeoutExplicit: true },
    "test",
    research,
    { body: { stream: true } },
    (event) => events.push(event),
  );
  expect(events).toEqual([{ ok: true }]);
  expect(dispatched).toEqual([{ headersTimeout: 200, bodyTimeout: 200 }]);
  await vi.waitFor(() => expect(sockets.size).toBe(0));
});

test.each([
  "headers",
  "after heartbeat",
])("SSE idle abort during %s is actionable and cleans up", async (phase) => {
  const { config, sockets } = await localServer((_request, response) => {
    if (phase === "after heartbeat") {
      response.setHeader("content-type", "text/event-stream");
      response.write(": heartbeat\n\n");
    }
  });
  await expect(
    executeOperationStream(
      { ...config, timeoutMs: 150, timeoutExplicit: true },
      "test",
      research,
      { body: { stream: true } },
      () => {},
    ),
  ).rejects.toMatchObject({
    exitCode: 4,
    message: expect.stringContaining("stalled: no data received for 150 ms"),
  });
  await vi.waitFor(() => expect(sockets.size).toBe(0));
});

test("an SSE callback failure cancels the unread body and closes the connection", async () => {
  const { config, sockets } = await localServer((_request, response) => {
    response.setHeader("content-type", "text/event-stream");
    response.write('data: {"ok":true}\n\n');
  });
  await expect(
    executeOperationStream(config, "test", research, { body: { stream: true } }, () => {
      throw new Error("consumer failed");
    }),
  ).rejects.toMatchObject({ exitCode: 4, message: expect.stringContaining("consumer failed") });
  await vi.waitFor(() => expect(sockets.size).toBe(0));
});

test.each([
  403, 500,
])("HTTP %i remains an API error, without an automatic retry", async (status) => {
  let calls = 0;
  const { config, sockets } = await localServer((_request, response) => {
    calls++;
    response.writeHead(status, { "content-type": "application/json" });
    response.end('{"detail":"upstream refusal"}');
  });
  const refresh = vi.fn(async () => "unused");
  await expect(executeOperation(config, "test", research, {}, refresh)).rejects.toMatchObject({
    status,
    exitCode: status >= 500 ? 6 : 5,
  });
  expect(calls).toBe(1);
  expect(refresh).not.toHaveBeenCalled();
  await vi.waitFor(() => expect(sockets.size).toBe(0));
});

test("a broken body remains a network error, not a deadline or an API error; no retry", async () => {
  let calls = 0;
  const { config, sockets } = await localServer((_request, response) => {
    calls++;
    response.writeHead(200, { "content-type": "application/json" });
    response.write('{"ok":');
    later(response, 50, () => response.destroy());
  });
  await expect(executeOperation(config, "test", research, {})).rejects.toMatchObject({
    exitCode: 4,
    message: expect.stringContaining("failed: UND_ERR_SOCKET"),
  });
  expect(calls).toBe(1);
  await vi.waitFor(() => expect(sockets.size).toBe(0));
});

test("401 retry cancels an unfinished body, keeps a fresh buffered budget, and retries only once", async () => {
  let calls = 0;
  let firstResponse: ServerResponse | undefined;
  const { config, sockets } = await localServer((_request, response) => {
    calls++;
    if (calls === 1) {
      firstResponse = response;
      response.writeHead(401, { "content-type": "application/json" });
      response.write('{"detail":');
    } else {
      response.writeHead(401, { "content-type": "application/json" });
      response.end('{"detail":"still unauthorized"}');
    }
  });
  const refresh = vi.fn(async () => {
    // Refresh already had its own budget before this fix. A new request gets a new deadline.
    await new Promise((resolve) => setTimeout(resolve, 250));
    return "refreshed";
  });
  await expect(
    executeOperation(
      { ...config, timeoutMs: 150, timeoutExplicit: true },
      "test",
      research,
      {},
      refresh,
    ),
  ).rejects.toMatchObject({
    status: 401,
    exitCode: 5,
    message: expect.stringContaining("still unauthorized"),
  });
  expect(calls).toBe(2);
  expect(refresh).toHaveBeenCalledOnce();
  await vi.waitFor(() => {
    expect(firstResponse?.destroyed).toBe(true);
    expect(sockets.size).toBe(0);
  });
});

// Opt-in LOCAL wall-clock proof, not a live API test. Runs the old/native path with
// default Agent timers alongside the fixed path, for both headers and body inactivity.
// ASKNEWS_LOCAL_TIMEOUT_SMOKE=1 pnpm exec vitest run test/integration/http-timeout.integration.test.ts -t wall-clock
// Allow at least 360 seconds in the outer process runner.
test.runIf(process.env.ASKNEWS_LOCAL_TIMEOUT_SMOKE === "1")(
  "wall-clock: headers and body can wait beyond the old 300-second boundary",
  async () => {
    const delayMs = 305_000;
    const { config } = await localServer((request, response) => {
      response.setHeader("content-type", "application/json");
      const bodyWait = request.url?.endsWith("/body");
      if (bodyWait) response.write('{"ok":');
      later(response, delayMs, () => response.end(bodyWait ? "true}" : '{"ok":true}'));
    });
    const oldAgent = new Agent();
    cleanups.push(async () => {
      await oldAgent.destroy();
    });
    const results = await Promise.all(
      ["headers", "body"].flatMap((phase) => {
        const start = performance.now();
        const old = fetch(`${config.apiUrl}/${phase}`, {
          method: research.method,
          dispatcher: oldAgent as unknown as NonNullable<RequestInit["dispatcher"]>,
          signal: AbortSignal.timeout(900_000),
        })
          .then((response) => response.text())
          .then(
            () => ({
              phase,
              transport: "old",
              elapsedMs: performance.now() - start,
              code: "unexpected success",
            }),
            (error) => ({
              phase,
              transport: "old",
              elapsedMs: performance.now() - start,
              code: error.cause?.code,
            }),
          );
        const fixed = executeOperation(
          config,
          "test",
          { ...research, path: `/v1/${phase}` },
          {},
        ).then((response) => ({
          phase,
          transport: "fixed",
          elapsedMs: performance.now() - start,
          data: response.data,
        }));
        return [old, fixed];
      }),
    );
    console.log(
      JSON.stringify({
        node: process.version,
        bundledUndici: process.versions.undici,
        delayMs,
        results,
      }),
    );
    for (const result of results) {
      expect(result.elapsedMs).toBeGreaterThan(300_000);
      if ("code" in result) {
        expect(result.code).toBe(
          result.phase === "headers" ? "UND_ERR_HEADERS_TIMEOUT" : "UND_ERR_BODY_TIMEOUT",
        );
      } else {
        expect(result.data).toEqual({ ok: true });
        expect(result.elapsedMs).toBeGreaterThanOrEqual(delayMs);
      }
    }
  },
  345_000,
);
