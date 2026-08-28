import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const CredentialSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("api_key"),
    apiKey: z.string().min(1),
    createdAt: z.string().datetime(),
  }),
  z.object({
    type: z.literal("oauth"),
    accessToken: z.string().min(1),
    refreshToken: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    scope: z.string().optional(),
    createdAt: z.string().datetime(),
  }),
]);

export type StoredCredential = z.infer<typeof CredentialSchema>;

export class CredentialStore {
  public constructor(private readonly configDir: string) {}

  private get path(): string {
    return join(this.configDir, "credentials.json");
  }

  public async read(): Promise<StoredCredential | null> {
    try {
      const raw = await readFile(this.path, "utf8");
      return CredentialSchema.parse(JSON.parse(raw));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  public async write(credential: StoredCredential): Promise<void> {
    await mkdir(this.configDir, { recursive: true, mode: 0o700 });
    await chmod(this.configDir, 0o700);
    const tempPath = `${this.path}.${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(credential, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await chmod(tempPath, 0o600);
    await rename(tempPath, this.path);
    await chmod(this.path, 0o600);
  }

  public async clear(): Promise<boolean> {
    try {
      const { unlink } = await import("node:fs/promises");
      await unlink(this.path);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }
}
