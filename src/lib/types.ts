export const OUTPUT_FORMATS = ["human", "table", "json", "jsonl", "yaml"] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

// Refreshes the stored OAuth access token and returns the new token, or null when no refresh is
// possible. Used by the HTTP layer to retry once after a 401 (token revoked before its expiry).
export type TokenRefresher = () => Promise<string | null>;

export type ParameterLocation = "header" | "path" | "query";

export interface OperationParameter {
  name: string;
  location: ParameterLocation;
  required: boolean;
  description?: string;
  type: "array" | "boolean" | "integer" | "number" | "object" | "string";
  itemType?: "boolean" | "integer" | "number" | "object" | "string";
  defaultValue?: unknown;
  allowedValues?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
}

export interface OperationDefinition {
  operationId: string;
  tag: string;
  command: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  parameters: OperationParameter[];
  requestBody: {
    required: boolean;
    contentTypes: string[];
    schema: unknown;
  } | null;
  safety: "high-cost" | "mutating" | "read-only";
}

export interface OperationManifest {
  generatedAt: string;
  schemaVersion: string;
  schemaUrl: string;
  operations: OperationDefinition[];
}

export interface RequestInput {
  parameters?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  data: T;
  headers: Headers;
  status: number;
}
