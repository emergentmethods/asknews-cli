import { Agent } from "undici";
import { afterEach, expect, test, vi } from "vitest";
import type { CliConfig } from "../src/lib/config.js";
import { ApiError } from "../src/lib/errors.js";
import { consumeServerSentEvents, executeRawRequest } from "../src/lib/http.js";

const config: CliConfig = {
  apiUrl: "http://api.invalid/v1",
  authUrl: "http://auth.invalid",
  oauthClientId: "test",
  output: "json",
  configDir: "/tmp/asknews-cli-timeout-test",
  timeoutMs: 900_000,
  noColor: true,
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test.each([
  "success",
  "api failure",
  "network failure",
  "body failure",
])("%s clears the buffered timer and destroys the scoped dispatcher", async (outcome) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const destroy = vi.spyOn(Agent.prototype, "destroy");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (outcome === "network failure") throw new TypeError("fetch failed");
      const response = new Response("{}", {
        status: outcome === "api failure" ? 403 : 200,
        headers: { "content-type": "application/json" },
      });
      if (outcome === "body failure") {
        vi.spyOn(response, "text").mockRejectedValue(new Error("body failed"));
      }
      return response;
    }),
  );
  const request = executeRawRequest(config, "test", "GET", "/test");
  if (outcome === "success") await expect(request).resolves.toMatchObject({ data: {} });
  else await expect(request).rejects.toBeInstanceOf(Error);
  expect(vi.getTimerCount()).toBe(0);
  expect(destroy).toHaveBeenCalled();
  expect(destroy.mock.instances[0]).toHaveProperty("destroyed", true);
});

test("401 body is cancelled before the refreshed request, and both attempt timers are cleared", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const cancel = vi.fn();
  const unauthorized = new Response(new ReadableStream({ cancel }), { status: 401 });
  const mockFetch = vi
    .fn()
    .mockResolvedValueOnce(unauthorized)
    .mockImplementationOnce(async () => {
      expect(cancel).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(1);
      return new Response("{}");
    });
  vi.stubGlobal("fetch", mockFetch);
  await executeRawRequest(config, "test", "GET", "/test", undefined, async () => "refreshed");
  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});

test.each([
  "complete",
  "callback error",
  "read error",
])("SSE %s releases the reader and preserves the original error", async (outcome) => {
  const cancel = vi.fn();
  const error = new ApiError("consumer error", 403);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (outcome === "read error") controller.error(error);
      else {
        controller.enqueue(new TextEncoder().encode('data: {"ok":true}\n\n'));
        if (outcome === "complete") controller.close();
      }
    },
    cancel,
  });
  const consume = consumeServerSentEvents(stream, () => {
    if (outcome === "callback error") throw error;
  });
  if (outcome === "complete") await expect(consume).resolves.toBeUndefined();
  else await expect(consume).rejects.toBe(error);
  expect(stream.locked).toBe(false);
  if (outcome === "callback error") expect(cancel).toHaveBeenCalledOnce();
});

test("dispatch-time limits override fetch-supplied headers/body limits", async () => {
  const dispatch = vi.spyOn(Agent.prototype, "dispatch").mockReturnValue(true);
  vi.stubGlobal("fetch", async (_url: unknown, init: RequestInit) => {
    const dispatcher = init.dispatcher as unknown as Agent;
    dispatcher.dispatch(
      {
        origin: "http://api.invalid",
        path: "/v1/test",
        method: "GET",
        headersTimeout: 300_000,
        bodyTimeout: 300_000,
      },
      {},
    );
    return new Response("{}");
  });
  await executeRawRequest(config, "test", "GET", "/test");
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      headersTimeout: 900_000,
      bodyTimeout: 900_000,
    }),
    expect.anything(),
  );
});

test("a body reader's generic AbortError uses the original deadline reason", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.stubGlobal("fetch", async (_url: unknown, init: RequestInit) => {
    const response = new Response("{}");
    vi.spyOn(response, "text").mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener(
            "abort",
            () => {
              reject(new DOMException("The operation was aborted", "AbortError"));
            },
            { once: true },
          );
        }),
    );
    return response;
  });
  const result = expect(executeRawRequest(config, "test", "GET", "/test")).rejects.toMatchObject({
    exitCode: 4,
    message: expect.stringContaining("timed out after 900000 ms"),
  });
  await vi.advanceTimersByTimeAsync(900_000);
  await result;
  expect(vi.getTimerCount()).toBe(0);
});
