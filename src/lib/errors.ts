export const EXIT_CODES = {
  usage: 2,
  auth: 3,
  network: 4,
  apiClient: 5,
  apiServer: 6,
  interrupted: 130,
} as const;

export class CliError extends Error {
  public constructor(
    message: string,
    public readonly exitCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UsageError extends CliError {
  public constructor(message: string, details?: unknown) {
    super(message, EXIT_CODES.usage, details);
  }
}

export class AuthError extends CliError {
  public constructor(message: string, details?: unknown) {
    super(message, EXIT_CODES.auth, details);
  }
}

export class NetworkError extends CliError {
  public constructor(message: string, details?: unknown) {
    super(message, EXIT_CODES.network, details);
  }
}

export class ApiError extends CliError {
  public constructor(
    message: string,
    public readonly status: number,
    details?: unknown,
  ) {
    super(message, status >= 500 ? EXIT_CODES.apiServer : EXIT_CODES.apiClient, details);
  }
}
