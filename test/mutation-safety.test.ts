import { describe, expect, test } from "vitest";
import { confirmMutation } from "../src/commands/api.js";
import type { OperationDefinition } from "../src/lib/types.js";

const operation = {
  operationId: "delete_alert",
  tag: "alerts",
  command: "delete-alert",
  method: "DELETE",
  path: "/v1/chat/alerts/{alert_id}",
  summary: "Delete alert",
  parameters: [],
  requestBody: null,
  safety: "mutating",
} satisfies OperationDefinition;

describe("mutation safety", () => {
  test("accepts explicit confirmation", async () => {
    await expect(confirmMutation(operation, true)).resolves.toBeUndefined();
  });

  test("requires --yes in noninteractive execution", async () => {
    await expect(confirmMutation(operation, false)).rejects.toThrow("rerun with --yes");
  });
});
