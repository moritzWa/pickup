export class UseCaseError extends Error {
  readonly type = "UseCaseError";

  constructor(readonly message: string, readonly error?: unknown) {
    super();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UseCaseError);
    }
  }
}
