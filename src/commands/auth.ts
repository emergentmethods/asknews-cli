import * as p from "@clack/prompts";
import type { Command } from "commander";
import { deviceLogin } from "../auth/oauth.js";
import { resolveCredential } from "../auth/resolve.js";
import { CredentialStore } from "../auth/store.js";
import { executeRawRequest } from "../lib/http.js";
import { writeDiagnostic, writeResult } from "../lib/output.js";
import { contextFrom } from "./context.js";

export const DEFAULT_SCOPES = [
  "openid",
  "offline_access",
  "news",
  "chat",
  "stories",
  "analytics",
  "distribution",
  "profile",
  "reddit",
];

export function registerAuthCommands(program: Command): void {
  const auth = program.command("auth").description("Authenticate the AskNews CLI");

  auth
    .command("login")
    .description("Log in with OAuth device flow or an API key")
    .option("--api-key [key]", "store an API key instead of using OAuth")
    .option("--no-browser", "do not open the verification URL")
    .option("--scope <scope...>", "OAuth scopes", DEFAULT_SCOPES)
    .action(
      async (
        options: { apiKey?: string | boolean; browser: boolean; scope: string[] },
        command,
      ) => {
        const { config, writer } = contextFrom(command);
        const store = new CredentialStore(config.configDir);
        const globalApiKey = (command.optsWithGlobals() as { apiKey?: string }).apiKey;
        if (options.apiKey !== undefined || globalApiKey !== undefined) {
          let apiKey =
            typeof options.apiKey === "string"
              ? options.apiKey
              : typeof globalApiKey === "string"
                ? globalApiKey
                : undefined;
          if (!apiKey) {
            if (!process.stdin.isTTY) {
              throw new Error("Pass --api-key <key> when stdin is not interactive");
            }
            const answer = await p.password({
              message: "AskNews API key",
              validate: (value) => (value ? undefined : "API key is required"),
            });
            if (p.isCancel(answer)) {
              process.exitCode = 130;
              return;
            }
            apiKey = answer;
          }
          await store.write({
            type: "api_key",
            apiKey,
            createdAt: new Date().toISOString(),
          });
          writeResult(writer, { authenticated: true, method: "api_key" });
          return;
        }
        const credential = await deviceLogin(config, {
          openBrowser: options.browser,
          scopes: options.scope,
          onPrompt: ({ verificationUri, userCode, expiresIn }) => {
            writeDiagnostic(writer, `Open ${verificationUri}`);
            writeDiagnostic(writer, `Enter code: ${userCode}`);
            writeDiagnostic(writer, `The code expires in ${Math.ceil(expiresIn / 60)} minutes.`);
          },
        });
        await store.write(credential);
        writeResult(writer, { authenticated: true, method: "oauth" });
      },
    );

  auth
    .command("status")
    .description("Show the active authentication method and verify it against AskNews")
    .option("--offline", "inspect local state without an API request")
    .action(async (options: { offline?: boolean }, command) => {
      const { config, writer } = contextFrom(command);
      const store = new CredentialStore(config.configDir);
      const stored = await store.read();
      if (options.offline) {
        writeResult(writer, {
          authenticated: Boolean(config.apiKey || stored),
          method: config.apiKey ? "environment" : (stored?.type ?? null),
          expiresAt: stored?.type === "oauth" ? (stored.expiresAt ?? null) : null,
        });
        return;
      }
      const credential = await resolveCredential(config);
      const response = await executeRawRequest(
        config,
        credential.token,
        "GET",
        "/profiles/me",
        undefined,
        credential.refresh,
      );
      writeResult(writer, {
        authenticated: true,
        method: credential.source,
        profile: response.data,
      });
    });

  auth
    .command("logout")
    .description("Remove locally stored AskNews credentials")
    .action(async (_options, command) => {
      const { config, writer } = contextFrom(command);
      const removed = await new CredentialStore(config.configDir).clear();
      writeResult(writer, { authenticated: false, removed });
    });
}
