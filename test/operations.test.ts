import { describe, expect, test } from "vitest";
import { getOperation, manifest, operationsByTag } from "../src/lib/operations.js";

describe("operation manifest access", () => {
  test("looks up and groups generated operations", () => {
    expect(getOperation("search_news").path).toBe("/v1/news/search");
    expect(operationsByTag().get("news")?.length).toBeGreaterThan(0);
    expect(manifest.operations.length).toBe(32);
  });

  test("rejects an unknown operation", () => {
    expect(() => getOperation("not_real")).toThrow("Unknown AskNews operation");
  });
});
