export class CodecError<OperationT = "ENCODE" | "DECODE"> extends Error {
  public readonly type = "CodecError";
  public readonly name = "CodecError";

  constructor(
    public readonly message: string,
    public readonly operation: OperationT,
    readonly error?: unknown
  ) {
    super();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodecError);
    }
  }
}
