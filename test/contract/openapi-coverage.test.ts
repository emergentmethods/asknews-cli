import { describe, expect, test } from "vitest";
import { DEFAULT_SCOPES } from "../../src/commands/auth.js";
import schema from "../../src/generated/openapi.json" with { type: "json" };
import manifestJson from "../../src/generated/operations.json" with { type: "json" };
import type { OperationManifest } from "../../src/lib/types.js";

const manifest = manifestJson as OperationManifest;
const methods = new Set(["delete", "get", "patch", "post", "put"]);

describe("OpenAPI coverage contract", () => {
  test("every public schema operation has exactly one generated command", () => {
    const schemaIds = Object.values(schema.paths).flatMap((pathItem) =>
      Object.entries(pathItem)
        .filter(([method]) => methods.has(method))
        .filter(([, operation]) => {
          const security = (operation as { security?: Record<string, string[]>[] }).security ?? [];
          return !security.some((requirement) =>
            Object.values(requirement).some((scopes) => scopes.includes("internal")),
          );
        })
        .map(([, operation]) => (operation as { operationId: string }).operationId),
    );
    const generatedIds = manifest.operations.map((operation) => operation.operationId);
    expect(new Set(generatedIds).size).toBe(generatedIds.length);
    expect(generatedIds.sort()).toEqual(schemaIds.sort());
  });

  test("does not expose internal-scope operations", () => {
    const internalIds = Object.values(schema.paths).flatMap((pathItem) =>
      Object.entries(pathItem)
        .filter(([method]) => methods.has(method))
        .filter(([, operation]) =>
          ((operation as { security?: Record<string, string[]>[] }).security ?? []).some(
            (requirement) =>
              Object.values(requirement).some((scopes) => scopes.includes("internal")),
          ),
        )
        .map(([, operation]) => (operation as { operationId: string }).operationId),
    );
    expect(manifest.operations.map((operation) => operation.operationId)).not.toEqual(
      expect.arrayContaining(internalIds),
    );
  });

  test("every operation has explicit safety metadata", () => {
    expect(manifest.operations.length).toBeGreaterThan(0);
    for (const operation of manifest.operations) {
      expect(["read-only", "high-cost", "mutating"]).toContain(operation.safety);
    }
  });

  test("default OAuth login requests every customer scope required by the schema", () => {
    const requiredScopes = new Set(
      Object.values(schema.paths).flatMap((pathItem) =>
        Object.entries(pathItem)
          .filter(([method]) => methods.has(method))
          .flatMap(([, operation]) =>
            ((operation as { security?: Record<string, string[]>[] }).security ?? []).flatMap(
              (requirement) => Object.values(requirement).flat(),
            ),
          )
          .filter((scope) => scope !== "internal"),
      ),
    );
    expect(DEFAULT_SCOPES).toEqual(expect.arrayContaining([...requiredScopes]));
  });
});
