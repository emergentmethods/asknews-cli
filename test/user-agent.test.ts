import { afterEach, expect, test, vi } from "vitest";
import type { CliConfig } from "../src/lib/config.js";
import { executeOperation, executeOperationStream, executeRawRequest } from "../src/lib/http.js";
import type { OperationDefinition } from "../src/lib/types.js";
import { CLI_VERSION, USER_AGENT } from "../src/lib/version.js";

const config: CliConfig = {
  apiUrl: "http://api.invalid/v1",
  authUrl: "http://auth.invalid",
  oauthClientId: "test",
  output: "json",
  configDir: "/tmp/asknews-cli-user-agent-test",
  timeoutMs: 1_000,
  noColor: true,
};

const operation: OperationDefinition = {
  operationId: "search_news",
  tag: "news",
  command: "news search",
  method: "GET",
  path: "/v1/news/search",
  summary: "",
  parameters: [],
  requestBody: null,
  safety: "read-only",
};

function stubFetch(): ReturnType<typeof vi.fn> {
  const mockFetch = vi.fn(
    async () =>
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
  );
  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
}

function sentUserAgent(mockFetch: ReturnType<typeof vi.fn>): string | null {
  const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
  return new Headers(init.headers).get("user-agent");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("the user agent names the CLI and its package version", () => {
  expect(USER_AGENT).toBe(`asknews-cli/${CLI_VERSION}`);
  expect(CLI_VERSION).toMatch(/^\d+\.\d+\.\d+/);
});

test("raw requests send the CLI user agent", async () => {
  const mockFetch = stubFetch();
  await executeRawRequest(config, "key", "GET", "/test");
  expect(sentUserAgent(mockFetch)).toBe(USER_AGENT);
});

test("operation requests send the CLI user agent", async () => {
  const mockFetch = stubFetch();
  await executeOperation(config, "key", operation, {});
  expect(sentUserAgent(mockFetch)).toBe(USER_AGENT);
});

test("streamed operation requests send the CLI user agent", async () => {
  const mockFetch = stubFetch();
  await executeOperationStream(config, "key", operation, { body: { stream: true } }, () => {});
  expect(sentUserAgent(mockFetch)).toBe(USER_AGENT);
});
