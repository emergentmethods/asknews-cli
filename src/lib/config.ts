import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { OUTPUT_FORMATS, type OutputFormat } from "./types.js";

const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  authUrl: z.string().url(),
  oauthClientId: z.string().min(1),
  output: z.enum(OUTPUT_FORMATS),
  configDir: z.string().min(1),
  apiKey: z.string().min(1).optional(),
  timeoutMs: z.number().int().positive(),
  // True when the timeout came from --timeout or ASKNEWS_TIMEOUT_MS, so per-operation
  // defaults (see OPERATION_TIMEOUT_MS in http.ts) must not override it.
  timeoutExplicit: z.boolean().optional(),
  noColor: z.boolean(),
});

export interface GlobalOptions {
  apiUrl?: string;
  authUrl?: string;
  oauthClientId?: string;
  output?: OutputFormat;
  json?: boolean;
  apiKey?: string;
  timeout?: string;
  noColor?: boolean;
}

export type CliConfig = z.infer<typeof ConfigSchema>;

function envBoolean(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function defaultConfigDir(platform = process.platform): string {
  if (process.env.ASKNEWS_CONFIG_DIR) {
    return process.env.ASKNEWS_CONFIG_DIR;
  }
  if (platform === "win32") {
    return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "asknews");
  }
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "asknews");
}

export function resolveConfig(options: GlobalOptions = {}): CliConfig {
  const output = options.json
    ? "json"
    : (options.output ?? process.env.ASKNEWS_OUTPUT ?? (process.stdout.isTTY ? "human" : "json"));
  const timeout = options.timeout ?? process.env.ASKNEWS_TIMEOUT_MS;

  return ConfigSchema.parse({
    apiUrl: stripTrailingSlash(
      options.apiUrl ?? process.env.ASKNEWS_API_URL ?? "https://api.asknews.app/v1",
    ),
    authUrl: stripTrailingSlash(
      options.authUrl ?? process.env.ASKNEWS_AUTH_URL ?? "https://auth.asknews.app",
    ),
    oauthClientId: options.oauthClientId ?? process.env.ASKNEWS_OAUTH_CLIENT_ID ?? "asknews-cli",
    output,
    configDir: defaultConfigDir(),
    apiKey: options.apiKey ?? process.env.ASKNEWS_API_KEY,
    timeoutMs: Number(timeout ?? "60000"),
    timeoutExplicit: timeout !== undefined,
    noColor:
      Boolean(options.noColor) ||
      envBoolean(process.env.NO_COLOR) ||
      envBoolean(process.env.ASKNEWS_PLAIN_OUTPUT),
  });
}

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
