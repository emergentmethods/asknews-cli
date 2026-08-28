import { describe, expect, test } from "vitest";
import { ApiError, AuthError, EXIT_CODES, NetworkError, UsageError } from "../src/lib/errors.js";

describe("stable exit codes", () => {
  test("maps typed failures to documented codes", () => {
    expect(new UsageError("usage").exitCode).toBe(EXIT_CODES.usage);
    expect(new AuthError("auth").exitCode).toBe(EXIT_CODES.auth);
    expect(new NetworkError("network").exitCode).toBe(EXIT_CODES.network);
    expect(new ApiError("bad", 400).exitCode).toBe(EXIT_CODES.apiClient);
    expect(new ApiError("down", 503).exitCode).toBe(EXIT_CODES.apiServer);
  });
});
