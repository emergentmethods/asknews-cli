import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { buildCli } from "../src/cli.js";

const originalEnv = { ...process.env };
let stdout = "";
let stderr = "";

beforeEach(async () => {
  process.env = {
    ...originalEnv,
    ASKNEWS_CONFIG_DIR: await mkdtemp(join(tmpdir(), "asknews-command-")),
  };
  delete process.env.ASKNEWS_API_KEY;
  delete process.env.ASKNEWS_API_URL;
  delete process.env.ASKNEWS_AUTH_URL;
  delete process.env.ASKNEWS_OAUTH_CLIENT_ID;
  delete process.env.ASKNEWS_OUTPUT;
  delete process.env.ASKNEWS_TIMEOUT_MS;
  process.exitCode = undefined;
  stdout = "";
  stderr = "";
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdout += String(chunk);
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderr += String(chunk);
    return true;
  });
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("command actions", () => {
  test("executes a curated news query with structured output", async () => {
    let requestUrl = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        requestUrl = String(input);
        return new Response('{"articles":[{"title":"Result"}]}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "news",
      "search",
      "energy",
      "--limit",
      "3",
      "--categories",
      "Technology",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "json",
    ]);

    expect(requestUrl).toContain("/v1/news/search");
    expect(requestUrl).toContain("query=energy");
    expect(requestUrl).toContain("n_articles=3");
    expect(requestUrl).toContain("categories=Technology");
    expect(requestUrl).toContain("time_filter=pub_date");
    expect(requestUrl).toContain("premium=true");
    expect(JSON.parse(stdout)).toEqual({ articles: [{ title: "Result" }] });
    expect(stderr).toBe("");
  });

  test("news search converts ISO datetimes and repeats list parameters", async () => {
    let requestUrl = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        requestUrl = String(input);
        return new Response('{"articles":[]}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "news",
      "search",
      "energy",
      "--start-datetime",
      "2026-01-01T00:00:00Z",
      "--end-datetime",
      "2026-01-02T00:00:00Z",
      "--languages",
      "en,fr",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "json",
    ]);

    expect(requestUrl).toContain("start_timestamp=1767225600");
    expect(requestUrl).toContain("end_timestamp=1767312000");
    expect(requestUrl).not.toContain("start_datetime");
    expect(requestUrl).toContain("languages=en&languages=fr");
    expect(stderr).toBe("");
  });

  test("news search rejects dropped schema flags", async () => {
    await expect(
      buildCli()
        .exitOverride()
        .parseAsync(["node", "asknews", "news", "search", "energy", "--method", "nl"]),
    ).rejects.toThrow();
  });

  test("x searches the websearch endpoint pinned to x.com and trims by return type", async () => {
    let requestUrl = "";
    const stubFetch = vi.fn(async (input: string | URL | Request) => {
      requestUrl = String(input);
      return new Response(
        '{"as_string":"summary","as_dicts":[{"raw_text":"post"}],"offset":"abc"}',
        {
          headers: { "content-type": "application/json" },
        },
      );
    });
    vi.stubGlobal("fetch", stubFetch);

    const base = [
      "node",
      "asknews",
      "x",
      "from:nasa artemis",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "json",
    ];
    await buildCli().parseAsync([...base, "--lookback", "12"]);

    expect(requestUrl).toContain("/v1/chat/websearch");
    expect(requestUrl).toContain("queries=from%3Anasa+artemis");
    expect(requestUrl).toContain("domains=x.com");
    expect(requestUrl).toContain("engine=v1.5");
    expect(requestUrl).toContain("lookback=12");
    expect(requestUrl).not.toContain("return_type");
    expect(JSON.parse(stdout)).toEqual({
      as_string: "",
      as_dicts: [{ raw_text: "post" }],
      offset: "abc",
    });

    stdout = "";
    await buildCli().parseAsync([...base, "--return-type", "string"]);
    expect(JSON.parse(stdout)).toEqual({ as_string: "summary", as_dicts: [], offset: "abc" });
    expect(stderr).toBe("");
  });

  test("executes a confirmed generated mutation with an inline body", async () => {
    let request: RequestInit | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        request = init;
        return new Response('{"created":true}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "api",
      "alerts",
      "create-alert",
      "--body",
      '{"query":"energy"}',
      "--yes",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "json",
    ]);

    expect(request?.method).toBe("POST");
    expect(request?.body).toBe('{"query":"energy"}');
    expect(JSON.parse(stdout)).toEqual({ created: true });
  });

  test("executes generated operations with explicit schema-derived flags", async () => {
    let requestUrl = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        requestUrl = String(input);
        return new Response('{"articles":[]}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "api",
      "news",
      "search-news",
      "--query",
      "energy",
      "--n-articles",
      "3",
      "--historical",
      "false",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "json",
    ]);

    expect(requestUrl).toContain("query=energy");
    expect(requestUrl).toContain("n_articles=3");
    expect(requestUrl).toContain("historical=false");
  });

  test("preserves omitted research defaults and accepts repeated schema options", async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response('{"ok":true}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "research",
      "energy",
      "--sources",
      "asknews",
      "--sources",
      "reddit",
      "--search-depth",
      "3",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "json",
    ]);

    expect(requestBody).toMatchObject({
      messages: [{ role: "user", content: "energy" }],
      sources: ["asknews", "reddit"],
      search_depth: 3,
    });
    expect(requestBody).not.toHaveProperty("append_references");
    expect(requestBody).not.toHaveProperty("model");
    // json output cannot stream, so the buffered request must not opt into streaming.
    expect(requestBody).not.toHaveProperty("stream");
  });

  test("streams research by default when the output format supports it", async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body));
        const encoder = new TextEncoder();
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('data: {"delta":{"text":"hello"}}\n\n'));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        );
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "research",
      "energy",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "jsonl",
    ]);

    expect(requestBody).toMatchObject({ stream: true });
    expect(stdout.trim()).toBe('{"delta":{"text":"hello"}}');
  });

  test("respects an explicit --stream false even for streaming-capable output", async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response('{"ok":true}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "research",
      "energy",
      "--stream",
      "false",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "jsonl",
    ]);

    expect(requestBody).toMatchObject({ stream: false });
  });

  test("supports direct generated request-body flags", async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response('{"ok":true}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "api",
      "chat",
      "deep-news",
      "--messages",
      '[{"role":"user","content":"energy"}]',
      "--engine",
      "v2.0",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "json",
    ]);

    expect(requestBody).toEqual({
      messages: [{ role: "user", content: "energy" }],
      engine: "v2.0",
    });
  });

  test("streams curated research as JSON Lines", async () => {
    let requestBody: Record<string, unknown> | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        requestBody = JSON.parse(String(init?.body));
        const encoder = new TextEncoder();
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode('data: {"delta":{"text":"hello"}}\n\n'));
              controller.enqueue(encoder.encode('data: {"delta":{"text":" world"}}\n\n'));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        );
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "research",
      "energy",
      "--stream",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "jsonl",
    ]);

    expect(requestBody).toMatchObject({ stream: true });
    expect(
      stdout
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line)),
    ).toEqual([{ delta: { text: "hello" } }, { delta: { text: " world" } }]);

    stdout = "";
    await buildCli().parseAsync([
      "node",
      "asknews",
      "api",
      "chat",
      "deep-news",
      "--messages",
      '[{"role":"user","content":"energy"}]',
      "--stream",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "jsonl",
    ]);
    expect(
      stdout
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line)),
    ).toHaveLength(2);
  });

  test("supports API-key login, offline status, and logout", async () => {
    await buildCli().parseAsync([
      "node",
      "asknews",
      "auth",
      "login",
      "--api-key",
      "ank_stored",
      "--output",
      "json",
    ]);
    expect(JSON.parse(stdout)).toEqual({ authenticated: true, method: "api_key" });
    stdout = "";

    await buildCli().parseAsync([
      "node",
      "asknews",
      "auth",
      "status",
      "--offline",
      "--output",
      "json",
    ]);
    expect(JSON.parse(stdout)).toMatchObject({ authenticated: true, method: "api_key" });
    stdout = "";

    await buildCli().parseAsync(["node", "asknews", "auth", "logout", "--output", "json"]);
    expect(JSON.parse(stdout)).toEqual({ authenticated: false, removed: true });
  });

  test("lists operation schemas and supports agent-skill opt-out", async () => {
    await buildCli().parseAsync([
      "node",
      "asknews",
      "api",
      "list",
      "--tag",
      "news",
      "--safety",
      "read-only",
      "--output",
      "json",
    ]);
    const operations = JSON.parse(stdout) as { operationId: string }[];
    expect(operations.some((operation) => operation.operationId === "search_news")).toBe(true);
    stdout = "";

    await buildCli().parseAsync([
      "node",
      "asknews",
      "cli",
      "setup",
      "--no-agent-skills",
      "--output",
      "json",
    ]);
    expect(JSON.parse(stdout)).toEqual({ installed: [], skipped: "agent skills disabled" });
  });

  test("executes every curated command family", async () => {
    const bodies: unknown[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        if (typeof init?.body === "string") bodies.push(JSON.parse(init.body));
        return new Response('{"ok":true}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );
    const commands = [
      ["news", "get", "article-id"],
      ["stories", "list", "--query", "energy", "--limit", "2", "--hours-back", "24"],
      ["stories", "get", "story-id"],
      [
        "research",
        "energy outlook",
        "--model",
        "open-source-best",
        "--sources",
        "asknews,google",
        "--append-references",
      ],
      ["web", "energy", "--hours-back", "12", "--domains", "reuters.com,apnews.com"],
      ["reddit", "energy", "--limit", "2"],
      ["wiki", "energy", "--limit", "2"],
      ["x", "from:nasa artemis", "--lookback", "12"],
      ["alerts", "list"],
      ["alerts", "get", "alert-id"],
      ["alerts", "create", "--body", '{"query":"energy"}', "--yes"],
      ["alerts", "update", "alert-id", "--body", '{"query":"markets"}', "--yes"],
      ["alerts", "delete", "alert-id", "--yes"],
      ["alerts", "run", "alert-id", "--yes"],
    ];

    for (const args of commands) {
      stdout = "";
      await buildCli().parseAsync([
        "node",
        "asknews",
        ...args,
        "--api-key",
        "ank_test",
        "--api-url",
        "https://api.example/v1",
        "--output",
        "json",
      ]);
      expect(JSON.parse(stdout)).toEqual({ ok: true });
    }
    expect(bodies).toContainEqual(
      expect.objectContaining({
        messages: [{ role: "user", content: "energy outlook" }],
        model: "open-source-best",
        sources: ["asknews", "google"],
      }),
    );
  });

  test("requests one context-rich story update by default", async () => {
    let requestUrl = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) => {
        requestUrl = String(input);
        return new Response('{"stories":[]}', {
          headers: { "content-type": "application/json" },
        });
      }),
    );

    await buildCli().parseAsync([
      "node",
      "asknews",
      "stories",
      "list",
      "--limit",
      "2",
      "--api-key",
      "ank_test",
      "--api-url",
      "https://api.example/v1",
      "--output",
      "json",
    ]);

    expect(requestUrl).toContain("expand_updates=true");
    expect(requestUrl).toContain("max_updates=1");
    expect(requestUrl).toContain("max_articles=0");
  });

  test("installs the project-local agent skill through the command", async () => {
    const project = await mkdtemp(join(tmpdir(), "asknews-project-skill-"));
    await buildCli().parseAsync([
      "node",
      "asknews",
      "cli",
      "setup",
      "--scope",
      "project",
      "--directory",
      project,
      "--output",
      "json",
    ]);
    const result = JSON.parse(stdout) as { installed: string[] };
    expect(result.installed).toEqual([join(project, ".agents", "skills", "asknews-cli")]);
  });
});
