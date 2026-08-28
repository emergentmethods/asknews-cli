import manifestJson from "../generated/operations.json" with { type: "json" };
import { UsageError } from "./errors.js";
import type { OperationDefinition, OperationManifest } from "./types.js";

export const manifest = manifestJson as OperationManifest;

const byId = new Map(manifest.operations.map((operation) => [operation.operationId, operation]));

export function getOperation(operationId: string): OperationDefinition {
  const operation = byId.get(operationId);
  if (!operation) {
    throw new UsageError(`Unknown AskNews operation "${operationId}"`);
  }
  return operation;
}

export function operationsByTag(): Map<string, OperationDefinition[]> {
  const grouped = new Map<string, OperationDefinition[]>();
  for (const operation of manifest.operations) {
    const operations = grouped.get(operation.tag) ?? [];
    operations.push(operation);
    grouped.set(operation.tag, operations);
  }
  return grouped;
}
