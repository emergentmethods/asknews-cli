import { describe, expect, test } from "vitest";
import { renderResult, streamText, writeDiagnostic, writeResult } from "../src/lib/output.js";

describe("output formats", () => {
  const value = [
    { id: 1, title: "One" },
    { id: 2, title: "Two" },
  ];

  test("renders deterministic JSON", () => {
    expect(renderResult(value, "json")).toMatchInlineSnapshot(`
      "[
        {
          "id": 1,
          "title": "One"
        },
        {
          "id": 2,
          "title": "Two"
        }
      ]"
    `);
  });

  test("renders JSON Lines", () => {
    expect(renderResult(value, "jsonl")).toBe('{"id":1,"title":"One"}\n{"id":2,"title":"Two"}');
  });

  test("renders YAML", () => {
    expect(renderResult(value, "yaml")).toContain("- id: 1");
  });

  test("renders a human table without ANSI when color is disabled", () => {
    expect(renderResult(value, "human", false)).toContain("Title");
    expect(renderResult(value, "human", false)).not.toContain("\u001B[");
  });

  test("renders nested AskNews records as concise tables", () => {
    const articles = renderResult(
      {
        articles: [
          {
            title: "Policy update",
            summary: "A concise explanation of the policy change and its implications.",
            source_id: "Reuters",
            classification: "Politics",
            country: "US",
            article_url: "https://example.test/article",
            entities: { Person: ["Example"] },
          },
        ],
      },
      "human",
      false,
    );
    expect(articles).toContain("Title");
    expect(articles).toContain("Policy update");
    expect(articles).toContain("concise explanation");
    expect(articles).not.toContain('"entities"');
    expect(
      renderResult(
        {
          as_dicts: [{ article_id: "a1", eng_title: "Production result", source_id: "AP" }],
          offset: 1,
          usage: { credits: 1 },
        },
        "human",
        false,
      ),
    ).toContain("Production result");
    expect(
      renderResult({ models: [{ model: "deepseek", type: "lite" }] }, "table", false),
    ).toContain("Tier");
    expect(
      renderResult(
        {
          stories: [
            {
              uuid: "story-1",
              categories: ["Politics"],
              countries_pct: { US: 80 },
              updates: [
                {
                  headline: "Election update",
                  story: "**Officials announced a new election timetable.**",
                  story_update_ts: 1781974697,
                },
              ],
            },
          ],
        },
        "human",
        false,
      ),
    ).toContain("Election update");
    expect(
      renderResult(
        {
          stories: [
            {
              uuid: "story-1",
              updates: [
                {
                  headline: "Election update",
                  story: "**Officials announced a new election timetable.**",
                  story_update_ts: 1781974697,
                },
              ],
            },
          ],
        },
        "human",
        false,
      ),
    ).not.toContain("story-1");
    expect(
      renderResult(
        {
          stories: [
            {
              updates: [{ headline: "Election update", story: "Summary", story_update_ts: 1 }],
            },
          ],
          offset: "04dcc125-26c3-4a86-aec2-2842045f61b5",
        },
        "human",
        false,
      ),
    ).not.toContain("04dcc125");
  });

  test("renders complete summaries with visible separators between rows", () => {
    const firstSummary = `${"Detailed context ".repeat(20)}FIRST-SUMMARY-END`;
    const secondSummary = `${"Additional context ".repeat(20)}SECOND-SUMMARY-END`;
    const table = renderResult(
      {
        articles: [
          { title: "First article", summary: firstSummary, source_id: "Reuters" },
          { title: "Second article", summary: secondSummary, source_id: "AP" },
        ],
      },
      "human",
      false,
    );

    expect(table).toContain("FIRST-SUMMARY-END");
    expect(table).toContain("SECOND-SUMMARY-END");
    expect(table).not.toContain("…");
    expect(table.match(/├/g)?.length).toBeGreaterThanOrEqual(2);
  });

  test("extracts text from common SSE event shapes", () => {
    expect(streamText({ choices: [{ delta: { content: "hello" } }] })).toBe("hello");
    expect(streamText({ delta: { text: " world" } })).toBe(" world");
    expect(streamText({ type: "status" })).toBe("");
  });

  test("renders web search with field-accurate columns and provenance", () => {
    const web = renderResult(
      {
        as_dicts: [
          {
            title: "Fed holds rates",
            url: "https://example.test/fed",
            source: "reuters.com",
            published: "2026-06-20T10:00:00Z",
            key_points: ["Rates unchanged", "Powell cautious"],
            raw_text: "The Federal Reserve held interest rates steady for a fourth meeting.",
          },
        ],
        offset: 0,
      },
      "table",
      false,
    );
    // Field-accurate headers, not a fabricated "Summary"; the URL cell shows the compact domain
    // (clickable on supporting terminals; full URL stays in JSON), never a broken wrapped link.
    expect(web).toContain("Key Points");
    expect(web).toContain("Raw Text");
    expect(web).toContain("Published");
    expect(web).toContain("URL");
    expect(web).toContain("example.test");
    expect(web).not.toContain("https://example.test/fed");
    expect(web).toContain("Rates unchanged");
    expect(web).not.toMatch(/\bSummary\b/);
  });

  test("uses context-first projections for other public list endpoints", () => {
    const reddit = renderResult(
      {
        as_dicts: [
          {
            id: "thread-1",
            title: "Reaction thread",
            summary: "Users discussed the policy impact.",
            subreddit_name: "technology",
            date: "2026-06-22T12:00:00Z",
            upvotes: 42,
          },
        ],
      },
      "human",
      false,
    );
    expect(reddit).toContain("Community");
    expect(reddit).toContain("technology");
    expect(reddit).toContain("Users discussed");
    expect(reddit).not.toContain("thread-1");

    const wiki = renderResult(
      {
        documents: [
          {
            point_id: "point-1",
            title: "Artificial intelligence",
            content: "Artificial intelligence is a field of computer science.",
            timestamp: "2026-06-20",
            categories: ["Computing"],
          },
        ],
      },
      "table",
      false,
    );
    expect(wiki).toContain("Content");
    expect(wiki).toContain("Artificial intelligence");
    expect(wiki).toContain("computer science");
    expect(wiki).not.toContain("point-1");

    const newsletters = renderResult(
      {
        items: [
          {
            id: "newsletter-1",
            name: "Daily Brief",
            query: "AI policy",
            cron: "0 9 * * *",
            sender: "AskNews",
            active: true,
          },
        ],
      },
      "human",
      false,
    );
    expect(newsletters).toContain("Daily Brief");
    expect(newsletters).toContain("AI policy");
    expect(newsletters).not.toContain("newsletter-1");

    const domains = renderResult(
      {
        items: [
          {
            id: "domain-1",
            name: "example.com",
            owner: "Example",
            publisher: "Example News",
            is_tollbit: false,
          },
        ],
      },
      "human",
      false,
    );
    expect(domains).toContain("example.com");
    expect(domains).toContain("Example News");
    expect(domains).not.toContain("domain-1");
  });

  test("uses context-first detail views while retaining actionable IDs", () => {
    const article = renderResult(
      {
        article_id: "article-1",
        title: "Policy update",
        summary: "A significant policy changed.",
        source_id: "Reuters",
        pub_date: "2026-06-22T10:00:00Z",
        entities: { Organization: ["Example"] },
      },
      "human",
      false,
    );
    expect(article.indexOf("Title:")).toBeLessThan(article.indexOf("ID:"));
    expect(article).toContain("A significant policy changed");
    expect(article).not.toContain("Organization");
  });

  test("renders scalars, empty values, nested objects, and preferred result arrays", () => {
    expect(renderResult(null, "human", false)).toBe("No data");
    expect(renderResult([], "human", false)).toBe("No results");
    expect(renderResult("plain", "human", false)).toBe("plain");
    expect(renderResult({ status: "ok", articles: value }, "human", false)).toContain("Status: ok");
    expect(renderResult({ nested: { value: 1 } }, "human", false)).toContain("value: 1");
  });

  test("keeps results and diagnostics on separate streams", () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const writer = {
      stdout: { write: (value: string) => stdout.push(value) } as unknown as NodeJS.WritableStream,
      stderr: { write: (value: string) => stderr.push(value) } as unknown as NodeJS.WritableStream,
      format: "json" as const,
      color: false,
    };
    writeResult(writer, { ok: true });
    writeDiagnostic(writer, "warning");
    expect(stdout.join("")).toBe('{\n  "ok": true\n}\n');
    expect(stderr.join("")).toBe("warning\n");
  });
});
