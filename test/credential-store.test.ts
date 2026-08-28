import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { CredentialStore } from "../src/auth/store.js";

describe("credential store", () => {
  test("round-trips credentials with restricted POSIX permissions", async () => {
    const root = await mkdtemp(join(tmpdir(), "asknews-credentials-"));
    const configDir = join(root, "config");
    const store = new CredentialStore(configDir);
    await store.write({
      type: "api_key",
      apiKey: "ank_test",
      createdAt: new Date().toISOString(),
    });

    expect(await store.read()).toMatchObject({ type: "api_key", apiKey: "ank_test" });
    if (process.platform !== "win32") {
      expect((await stat(configDir)).mode & 0o777).toBe(0o700);
      expect((await stat(join(configDir, "credentials.json"))).mode & 0o777).toBe(0o600);
    }
    await expect(store.clear()).resolves.toBe(true);
    await expect(store.read()).resolves.toBeNull();
    await expect(store.clear()).resolves.toBe(false);
  });
});
