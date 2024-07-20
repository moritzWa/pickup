export class UnexpectedError extends Error {
  public readonly type = "UnexpectedError";

  constructor(readonly error?: Error | unknown, readonly data?: unknown) {
    super();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnexpectedError);
    }
  }

  public get message(): string {
    if (this.error instanceof Error) {
      return this.error.message;
    }

    return "An unexpected error occurred.";
  }
}
