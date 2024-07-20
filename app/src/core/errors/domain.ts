export class DomainError extends Error {
  public readonly type = "DomainError";

  constructor(
    readonly message: string,
    readonly error?: any,
    readonly data?: any
  ) {
    super();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }
}

export class NotFoundError extends Error {
  public readonly type = "NotFoundError";

  constructor(
    readonly message: string,
    readonly error?: any,
    readonly data?: any
  ) {
    super();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

export class FailedWriteError extends Error {
  public readonly type = "FailedWriteError";

  constructor(
    readonly message: string,
    readonly error?: any,
    readonly data?: any
  ) {
    super();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FailedWriteError);
    }
  }
}

export class ValidationError extends Error {
  public readonly type = "ValidationError";

  constructor(
    readonly message: string,
    readonly error?: any,
    readonly data?: any
  ) {
    super();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

export class MagicAuthError extends Error {
  public readonly type = "MagicAuthError";

  constructor(
    readonly message: string,
    readonly error?: any,
    readonly data?: any
  ) {
    super();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MagicAuthError);
    }
  }
}
