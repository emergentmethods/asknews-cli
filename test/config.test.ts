import { afterEach, describe, expect, test } from "vitest";
import { defaultConfigDir, resolveConfig, stripTrailingSlash } from "../src/lib/config.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("configuration", () => {
  test("flags override environment and defaults", () => {
    process.env.ASKNEWS_API_URL = "https://environment.example/v1";
    const config = resolveConfig({
      apiUrl: "https://flag.example/v1/",
      apiKey: "ank_test",
      output: "yaml",
    });
    expect(config.apiUrl).toBe("https://flag.example/v1");
    expect(config.apiKey).toBe("ank_test");
    expect(config.output).toBe("yaml");
  });

  test("tracks whether the timeout was set explicitly", () => {
    expect(resolveConfig({})).toMatchObject({ timeoutMs: 60_000, timeoutExplicit: false });
    expect(resolveConfig({ timeout: "120000" })).toMatchObject({
      timeoutMs: 120_000,
      timeoutExplicit: true,
    });
    process.env.ASKNEWS_TIMEOUT_MS = "90000";
    expect(resolveConfig({})).toMatchObject({ timeoutMs: 90_000, timeoutExplicit: true });
  });

  test("uses the platform config convention", () => {
    process.env.ASKNEWS_CONFIG_DIR = "/tmp/asknews-config-test";
    expect(defaultConfigDir()).toBe("/tmp/asknews-config-test");
  });

  test("removes trailing slashes", () => {
    expect(stripTrailingSlash("https://api.example/v1///")).toBe("https://api.example/v1");
  });
});
