import { readFile } from "node:fs/promises";
import type { CliConfig } from "./config.js";
import { ApiError, NetworkError, UsageError } from "./errors.js";
import { redact } from "./redact.js";
import type { ApiResponse, OperationDefinition, RequestInput, TokenRefresher } from "./types.js";

// Default timeouts for operations whose normal completion time exceeds the global 60 s
// default. Applied only when the user did not set --timeout or ASKNEWS_TIMEOUT_MS.
const OPERATION_TIMEOUT_MS: Record<string, number> = {
  deep_news: 900_000,
};

function effectiveTimeoutMs(config: CliConfig, operation: OperationDefinition): number {
  if (config.timeoutExplicit) return config.timeoutMs;
  return OPERATION_TIMEOUT_MS[operation.operationId] ?? config.timeoutMs;
}

export async function executeOperation<T>(
  config: CliConfig,
  credential: string,
  operation: OperationDefinition,
  input: RequestInput,
  refresh?: TokenRefresher,
): Promise<ApiResponse<T>> {
  const { url, init } = prepareOperationRequest(config, credential, operation, input);
  return executeRequest<T>(config, url, init, refresh, effectiveTimeoutMs(config, operation));
}

export async function executeOperationStream(
  config: CliConfig,
  credential: string,
  operation: OperationDefinition,
  input: RequestInput,
  onEvent: (event: unknown) => void,
  refresh?: TokenRefresher,
): Promise<void> {
  const { url, init } = prepareOperationRequest(config, credential, operation, input);
  const timeoutMs = effectiveTimeoutMs(config, operation);
  // A streamed response stays open for as long as the server keeps producing events, so the
  // timeout must bound inactivity, not total duration: it is reset on every received chunk.
  const idle = startIdleTimeout(url, timeoutMs);
  try {
    let response = await sendRequest(config, url, { ...init, signal: idle.signal }, timeoutMs);
    if (response.status === 401 && refresh) {
      idle.reset();
      response = await retryWithRefreshedToken(
        config,
        url,
        init,
        refresh,
        response,
        timeoutMs,
        idle.signal,
      );
    }
    if (!response.ok) {
      const text = await readBody(url, timeoutMs, () => response.text());
      const data = parseResponse(text, response.headers.get("content-type"));
      const detail = formatErrorDetail(data, response.statusText);
      throw new ApiError(
        `AskNews API returned ${response.status}: ${detail}`,
        response.status,
        data,
      );
    }
    const body = response.body;
    if (!body || !response.headers.get("content-type")?.includes("text/event-stream")) {
      const text = await readBody(url, timeoutMs, () => response.text());
      onEvent(parseResponse(text, response.headers.get("content-type")));
      return;
    }
    await readBody(url, timeoutMs, () => consumeServerSentEvents(body, onEvent, idle.reset));
  } finally {
    idle.clear();
  }
}

export async function executeRawRequest<T>(
  config: CliConfig,
  credential: string,
  method: string,
  requestPath: string,
  body?: unknown,
  refresh?: TokenRefresher,
): Promise<ApiResponse<T>> {
  const path = requestPath.startsWith("/") ? requestPath : `/${requestPath}`;
  const url = new URL(`${config.apiUrl}${path}`);
  const headers = new Headers({
    accept: "application/json",
    authorization: `Bearer ${credential}`,
  });
  return executeRequest<T>(
    config,
    url,
    {
      method,
      headers,
      ...(body === undefined
        ? {}
        : {
            body: JSON.stringify(body),
            headers: new Headers({
              ...Object.fromEntries(headers.entries()),
              "content-type": "application/json",
            }),
          }),
    },
    refresh,
  );
}

export async function parseBodyInput(raw: string | undefined): Promise<unknown> {
  if (raw === undefined) {
    return undefined;
  }
  const content = raw.startsWith("@") ? await readFile(raw.slice(1), "utf8") : raw;
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new UsageError("Request body must be JSON or @path/to/file.json", error);
  }
}

export function parseParameterAssignments(values: string[] = []): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const assignment of values) {
    const separator = assignment.indexOf("=");
    if (separator <= 0) {
      throw new UsageError(`Invalid parameter "${assignment}"; expected name=value`);
    }
    const name = assignment.slice(0, separator);
    const raw = assignment.slice(separator + 1);
    const value = parseScalar(raw);
    const current = result[name];
    result[name] =
      current === undefined
        ? value
        : Array.isArray(current)
          ? [...current, value]
          : [current, value];
  }
  return result;
}

function buildLocationValues(
  operation: OperationDefinition,
  values: Record<string, unknown>,
): { path: string; query: Map<string, string[]> } {
  let path = operation.path.replace(/^\/v1(?=\/|$)/, "");
  const query = new Map<string, string[]>();
  const known = new Set(operation.parameters.map((parameter) => parameter.name));
  for (const key of Object.keys(values)) {
    if (!known.has(key)) {
      throw new UsageError(`Unknown parameter "${key}" for ${operation.operationId}`);
    }
  }
  for (const parameter of operation.parameters) {
    const value = values[parameter.name];
    if (value === undefined || value === null || value === "") {
      if (parameter.required) {
        throw new UsageError(`Missing required parameter "${parameter.name}"`);
      }
      continue;
    }
    const rendered = (Array.isArray(value) ? value : [value]).map(String);
    if (parameter.location === "path") {
      path = path.replace(`{${parameter.name}}`, encodeURIComponent(rendered[0] ?? ""));
    } else if (parameter.location === "query") {
      query.set(parameter.name, rendered);
    }
  }
  return { path, query };
}

function prepareOperationRequest(
  config: CliConfig,
  credential: string,
  operation: OperationDefinition,
  input: RequestInput,
): { url: URL; init: RequestInit } {
  const { path, query } = buildLocationValues(operation, input.parameters ?? {});
  const baseUrl = operation.path.startsWith("/v1")
    ? config.apiUrl
    : config.apiUrl.replace(/\/v1$/, "");
  const url = new URL(`${baseUrl}${path}`);
  for (const [key, values] of query) {
    for (const value of values) url.searchParams.append(key, value);
  }
  const headers = new Headers({
    accept: input.body && isStreamBody(input.body) ? "text/event-stream" : "application/json",
    authorization: `Bearer ${credential}`,
    ...input.headers,
  });
  let body: string | undefined;
  if (input.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(input.body);
  }
  return {
    url,
    init: {
      method: operation.method,
      headers,
      ...(body ? { body } : {}),
    },
  };
}

function parseScalar(value: string): unknown {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (
    (value.startsWith("[") && value.endsWith("]")) ||
    (value.startsWith("{") && value.endsWith("}"))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

async function executeRequest<T>(
  config: CliConfig,
  url: URL,
  init: RequestInit,
  refresh?: TokenRefresher,
  timeoutMs = config.timeoutMs,
): Promise<ApiResponse<T>> {
  let response = await sendRequest(config, url, init, timeoutMs);
  if (response.status === 401 && refresh) {
    response = await retryWithRefreshedToken(config, url, init, refresh, response, timeoutMs);
  }
  const text = await readBody(url, timeoutMs, () => response.text());
  const data = parseResponse(text, response.headers.get("content-type"));
  if (!response.ok) {
    const detail = formatErrorDetail(data, response.statusText);
    throw new ApiError(`AskNews API returned ${response.status}: ${detail}`, response.status, data);
  }
  return { data: data as T, headers: response.headers, status: response.status };
}

function formatErrorDetail(data: unknown, statusText: string): string {
  if (!data || typeof data !== "object" || !("detail" in data)) return statusText;
  const detail = (data as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;
  return JSON.stringify(detail);
}

async function sendRequest(
  config: CliConfig,
  url: URL,
  init: RequestInit,
  timeoutMs = config.timeoutMs,
): Promise<Response> {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(timeoutMs), ...init });
  } catch (error) {
    throw new NetworkError(describeNetworkError(url, timeoutMs, error), redact(error));
  }
}

// Runs a response-body read (buffered text or SSE consumption), converting abort/network
// failures into the same actionable NetworkError produced for request failures. Without this,
// a timeout firing mid-body surfaces as a bare "The operation was aborted" from undici.
async function readBody<T>(url: URL, timeoutMs: number, read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof ApiError || error instanceof NetworkError) throw error;
    throw new NetworkError(describeNetworkError(url, timeoutMs, error), redact(error));
  }
}

function startIdleTimeout(
  url: URL,
  timeoutMs: number,
): { signal: AbortSignal; reset: () => void; clear: () => void } {
  const controller = new AbortController();
  const abort = () => {
    const reason = new Error(
      `Stream from ${url.origin} stalled: no data received for ${timeoutMs} ms; raise --timeout or narrow the query`,
    );
    reason.name = "TimeoutError";
    controller.abort(reason);
  };
  let timer = setTimeout(abort, timeoutMs);
  return {
    signal: controller.signal,
    reset: () => {
      clearTimeout(timer);
      timer = setTimeout(abort, timeoutMs);
    },
    clear: () => clearTimeout(timer),
  };
}

// On a 401, refresh the token once and retry. If the refresh yields no token (no refresh token, or
// the refresh itself fails), keep the original 401 response so the caller surfaces it unchanged.
async function retryWithRefreshedToken(
  config: CliConfig,
  url: URL,
  init: RequestInit,
  refresh: TokenRefresher,
  unauthorized: Response,
  timeoutMs = config.timeoutMs,
  signal?: AbortSignal,
): Promise<Response> {
  const token = await refresh().catch(() => null);
  if (!token) {
    return unauthorized;
  }
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  return sendRequest(config, url, { ...init, headers, ...(signal ? { signal } : {}) }, timeoutMs);
}

function describeNetworkError(url: URL, timeoutMs: number, error: unknown): string {
  if (error instanceof Error && error.name === "TimeoutError") {
    // Idle-timeout aborts (startIdleTimeout) already carry a stream-specific message.
    if (error.message.startsWith("Stream from ")) return error.message;
    return `Request to ${url.origin} timed out after ${timeoutMs} ms; raise --timeout or narrow the query`;
  }
  const cause =
    error instanceof Error && error.cause !== undefined && error.cause !== null
      ? error.cause
      : error;
  const code =
    typeof (cause as { code?: unknown })?.code === "string"
      ? (cause as { code: string }).code
      : undefined;
  const reason =
    code ?? (cause instanceof Error ? cause.message : undefined) ?? String(cause ?? error);
  return `Request to ${url.origin} failed: ${reason}`;
}

function parseResponse(text: string, contentType: string | null): unknown {
  if (!text) {
    return null;
  }
  if (contentType?.includes("text/event-stream")) {
    return parseServerSentEvents(text);
  }
  if (contentType?.includes("json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

export function parseServerSentEvents(text: string): unknown[] {
  const events: unknown[] = [];
  for (const block of text.split(/\r?\n\r?\n/)) {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data || data === "[DONE]") continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      events.push(data);
    }
  }
  return events;
}

export async function consumeServerSentEvents(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: unknown) => void,
  onActivity?: () => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    onActivity?.();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      const event = parseEventBlock(block);
      if (event !== undefined) onEvent(event);
    }
    if (done) break;
  }
  const finalEvent = parseEventBlock(buffer);
  if (finalEvent !== undefined) onEvent(finalEvent);
}

function parseEventBlock(block: string): unknown | undefined {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data || data === "[DONE]") return undefined;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function isStreamBody(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).stream === true,
  );
}
