import { IError } from "./IError";

export class CodecError<OperationT = "ENCODE" | "DECODE"> implements IError {
    public readonly type = "CodecError";
    public readonly name = "CodecError";

    constructor(
        public readonly message: string,
        public readonly operation: OperationT,
        readonly error?: unknown
    ) {}
}
