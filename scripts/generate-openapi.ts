import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { OpenAPIV3_1 } from "openapi-types";
import type {
  HttpMethod,
  OperationDefinition,
  OperationManifest,
  OperationParameter,
} from "../src/lib/types.js";

const DEFAULT_SCHEMA_URL = "https://api.asknews.app/openapi.json";
const HTTP_METHODS = new Set(["delete", "get", "patch", "post", "put"]);
const HIGH_COST_OPERATIONS = new Set([
  "build_graph",
  "create_charts_endpoint",
  "deep_news",
  "get_forecast",
  "get_chat_completions",
  "live_web_search",
]);
const MUTATING_OPERATIONS = new Set([
  "create_alert",
  "delete_alert",
  "delete_byok_key",
  "delete_newsletter",
  "delete_newsletter_contact",
  "index_urls",
  "patch_newsletter_contact",
  "post_newsletter",
  "post_newsletter_contacts",
  "put_alert",
  "put_newsletter",
  "run_alert",
  "unsubscribe_newsletter",
  "update_domain",
  "upsert_byok_key",
]);

const schemaUrl = process.env.ASKNEWS_SCHEMA_URL ?? DEFAULT_SCHEMA_URL;
const outputDirectory = resolve("src/generated");

const response = await fetch(schemaUrl);
if (!response.ok) {
  throw new Error(`Unable to download OpenAPI schema: HTTP ${response.status}`);
}
const schema = (await response.json()) as OpenAPIV3_1.Document;
const operations = extractOperations(schema);
if (operations.length === 0) {
  throw new Error("OpenAPI schema contained no customer-facing operations");
}
const schemaText = `${JSON.stringify(schema, null, 2)}\n`;
const manifest: OperationManifest & { schemaSha256: string } = {
  generatedAt: `schema-version:${schema.info.version}`,
  schemaVersion: schema.info.version,
  schemaUrl,
  schemaSha256: createHash("sha256").update(schemaText).digest("hex"),
  operations,
};
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(outputDirectory, "openapi.json"), schemaText, "utf8");
await writeFile(
  resolve(outputDirectory, "operations.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);
process.stdout.write(
  `Generated ${operations.length} operations from AskNews API ${schema.info.version}\n`,
);

function extractOperations(schema: OpenAPIV3_1.Document): OperationDefinition[] {
  const result: OperationDefinition[] = [];
  for (const [path, pathItem] of Object.entries(schema.paths ?? {})) {
    if (!pathItem || "$ref" in pathItem) {
      continue;
    }
    for (const [method, candidate] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method) || !candidate || typeof candidate !== "object") {
        continue;
      }
      const operation = candidate as OpenAPIV3_1.OperationObject;
      if (!operation.operationId) {
        throw new Error(`${method.toUpperCase()} ${path} has no operationId`);
      }
      if (!isCustomerFacing(operation)) {
        continue;
      }
      const tag = operation.tags?.[0] ?? "other";
      result.push({
        operationId: operation.operationId,
        tag: commandName(tag),
        command: commandName(operation.operationId),
        method: method.toUpperCase() as HttpMethod,
        path,
        summary: operation.summary ?? operation.operationId,
        ...(operation.description ? { description: operation.description } : {}),
        parameters: extractParameters(pathItem.parameters, operation.parameters),
        requestBody: extractRequestBody(operation.requestBody, schema),
        safety: safetyFor(method, operation.operationId),
      });
    }
  }
  return result.sort(
    (left, right) =>
      left.tag.localeCompare(right.tag) || left.operationId.localeCompare(right.operationId),
  );
}

function isCustomerFacing(operation: OpenAPIV3_1.OperationObject): boolean {
  return !(operation.security ?? []).some((requirement) =>
    Object.values(requirement).some((scopes) => scopes.includes("internal")),
  );
}

function extractParameters(
  pathParameters: (OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject)[] | undefined,
  operationParameters: (OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject)[] | undefined,
): OperationParameter[] {
  return [...(pathParameters ?? []), ...(operationParameters ?? [])]
    .filter((value): value is OpenAPIV3_1.ParameterObject => !("$ref" in value))
    .map((parameter) => {
      const schema =
        parameter.schema && !("$ref" in parameter.schema) ? parameter.schema : undefined;
      return {
        name: parameter.name,
        location: parameter.in as OperationParameter["location"],
        required: Boolean(parameter.required),
        ...(parameter.description ? { description: parameter.description } : {}),
        type: normalizeType(schema),
        ...(schema?.type === "array" && schema.items && !Array.isArray(schema.items)
          ? {
              itemType: normalizeType(
                "$ref" in schema.items ? undefined : (schema.items as OpenAPIV3_1.SchemaObject),
              ) as Exclude<OperationParameter["itemType"], undefined>,
            }
          : {}),
        ...(schema?.default !== undefined ? { defaultValue: schema.default } : {}),
        ...(schema?.enum ? { allowedValues: schema.enum } : {}),
        ...(schema?.format ? { format: schema.format } : {}),
        ...(typeof schema?.minimum === "number" ? { minimum: schema.minimum } : {}),
        ...(typeof schema?.maximum === "number" ? { maximum: schema.maximum } : {}),
      };
    });
}

function extractRequestBody(
  requestBody: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.RequestBodyObject | undefined,
  document: OpenAPIV3_1.Document,
): OperationDefinition["requestBody"] {
  if (!requestBody || "$ref" in requestBody) {
    return null;
  }
  const contentTypes = Object.keys(requestBody.content);
  const preferred =
    requestBody.content["application/json"] ??
    requestBody.content["application/x-www-form-urlencoded"] ??
    requestBody.content[contentTypes[0] ?? ""];
  return {
    required: Boolean(requestBody.required),
    contentTypes,
    schema: dereferenceSchema(preferred?.schema, document, new Set()),
  };
}

function dereferenceSchema(
  schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject | undefined,
  document: OpenAPIV3_1.Document,
  seen: Set<string>,
): unknown {
  if (!schema) return null;
  if ("$ref" in schema) {
    if (seen.has(schema.$ref)) return { $ref: schema.$ref };
    const resolved = resolveLocalRef(schema.$ref, document);
    if (!resolved) return { $ref: schema.$ref };
    return dereferenceSchema(resolved, document, new Set([...seen, schema.$ref]));
  }
  const result: Record<string, unknown> = { ...schema };
  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([name, property]) => [
        name,
        dereferenceSchema(property, document, seen),
      ]),
    );
  }
  const items = (schema as OpenAPIV3_1.ArraySchemaObject).items;
  if (items) {
    result.items = Array.isArray(items)
      ? items.map((item: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject) =>
          dereferenceSchema(item, document, seen),
        )
      : dereferenceSchema(items, document, seen);
  }
  for (const keyword of ["allOf", "anyOf", "oneOf"] as const) {
    if (schema[keyword]) {
      result[keyword] = schema[keyword]?.map((item) => dereferenceSchema(item, document, seen));
    }
  }
  return result;
}

function resolveLocalRef(
  reference: string,
  document: OpenAPIV3_1.Document,
): OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject | undefined {
  if (!reference.startsWith("#/")) return undefined;
  let current: unknown = document;
  for (const segment of reference
    .slice(2)
    .split("/")
    .map((value) => value.replace(/~1/g, "/").replace(/~0/g, "~"))) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current as OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject | undefined;
}

function normalizeType(schema: OpenAPIV3_1.SchemaObject | undefined): OperationParameter["type"] {
  const type = Array.isArray(schema?.type) ? schema.type[0] : schema?.type;
  if (
    type === "array" ||
    type === "boolean" ||
    type === "integer" ||
    type === "number" ||
    type === "object" ||
    type === "string"
  ) {
    return type;
  }
  return "string";
}

function safetyFor(_method: string, operationId: string): OperationDefinition["safety"] {
  if (MUTATING_OPERATIONS.has(operationId)) {
    return "mutating";
  }
  return HIGH_COST_OPERATIONS.has(operationId) ? "high-cost" : "read-only";
}

function commandName(value: string): string {
  return value
    .replace(/_/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
