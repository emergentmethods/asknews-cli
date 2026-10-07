import packageJson from "../../package.json" with { type: "json" };

export const CLI_VERSION: string = packageJson.version;

// Identifies CLI traffic at the API gateway (usage is attributed per channel), next to the SDKs'
// own `asknews-sdk-<lang>` agents. Never include anything user-specific here.
export const USER_AGENT = `asknews-cli/${CLI_VERSION}`;
