const SENSITIVE_KEY = /(?:api[-_]?key|authorization|access[-_]?token|refresh[-_]?token|secret)/i;
const BEARER = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const ASKNEWS_KEY = /\bank_[A-Za-z0-9_-]+\b/g;

export function redactString(value: string): string {
  return value.replace(BEARER, "Bearer [REDACTED]").replace(ASKNEWS_KEY, "[REDACTED]");
}

export function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? "[REDACTED]" : redact(item),
      ]),
    );
  }
  return value;
}
