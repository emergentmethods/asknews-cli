import { describe, expect, test } from "vitest";
import { formatOperationHelp } from "../src/commands/api.js";
import type { OperationDefinition } from "../src/lib/types.js";

describe("generated help", () => {
  test("describes operation identity, safety, body invocation, and output", () => {
    const operation = {
      operationId: "example",
      tag: "news",
      command: "example",
      method: "POST",
      path: "/v1/example/{id}",
      summary: "Example operation",
      parameters: [
        {
          name: "id",
          location: "path",
          required: true,
          type: "string",
          description: "The resource identifier.",
        },
        {
          name: "mode",
          location: "query",
          required: false,
          type: "string",
          defaultValue: "fast",
          allowedValues: ["fast", "rich"],
        },
      ],
      requestBody: {
        required: true,
        contentTypes: ["application/json"],
        schema: {
          type: "object",
          required: ["query"],
          properties: {
            query: { type: "string", description: "Research question." },
            stream: { type: "boolean", default: false },
          },
        },
      },
      safety: "mutating",
    } satisfies OperationDefinition;

    const help = formatOperationHelp(operation);

    expect(help).toContain("POST /v1/example/{id}");
    expect(help).toContain("Changes server state");
    expect(help).toContain("@request.json");
    expect(help).toContain("human|table|json|jsonl|yaml");
  });
});
