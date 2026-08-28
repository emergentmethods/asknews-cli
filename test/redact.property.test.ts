import { assert, property, string } from "fast-check";
import { describe, expect, test } from "vitest";
import { redact, redactString } from "../src/lib/redact.js";

describe("secret redaction", () => {
  test("redacts authorization and API-key-shaped strings", () => {
    expect(redactString("Authorization: Bearer ank_secret_value")).not.toContain("ank_secret");
    expect(redact({ accessToken: "token", nested: { api_key: "key" } })).toEqual({
      accessToken: "[REDACTED]",
      nested: { api_key: "[REDACTED]" },
    });
  });

  test("never preserves a generated bearer value", () => {
    assert(
      property(string({ minLength: 1 }), (token) => {
        const safeToken = Buffer.from(token).toString("base64url");
        expect(redactString(`Bearer ${safeToken}`)).not.toContain(safeToken);
      }),
    );
  });
});
