import { describe, expect, test } from "vitest";
import { parseBodyInput, parseParameterAssignments } from "../src/lib/http.js";

describe("request input", () => {
  test("parses repeated parameters as arrays and scalar types", () => {
    expect(
      parseParameterAssignments([
        "query=energy",
        "domains=example.com",
        "domains=example.org",
        "limit=5",
        "historical=true",
      ]),
    ).toEqual({
      query: "energy",
      domains: ["example.com", "example.org"],
      limit: 5,
      historical: true,
    });
  });

  test("parses inline JSON bodies", async () => {
    await expect(parseBodyInput('{"query":"energy"}')).resolves.toEqual({ query: "energy" });
    await expect(parseBodyInput("not-json")).rejects.toThrow("must be JSON");
    await expect(parseBodyInput(undefined)).resolves.toBeUndefined();
  });

  test("rejects malformed parameter assignments", () => {
    expect(() => parseParameterAssignments(["missing-separator"])).toThrow("expected name=value");
  });
});
