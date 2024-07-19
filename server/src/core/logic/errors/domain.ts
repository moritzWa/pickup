import { IError } from "./IError";

export class DomainError implements IError {
    public readonly type = "DomainError";

    constructor(
        readonly message: string,
        readonly error?: any,
        readonly data?: any
    ) {}
}

export class NotFoundError implements IError {
    public readonly type = "NotFoundError";

    constructor(
        readonly message: string,
        readonly error?: any,
        readonly data?: any
    ) {}
}

export class FailedWriteError implements IError {
    public readonly type = "FailedWriteError";

    constructor(
        readonly message: string,
        readonly error?: any,
        readonly data?: any
    ) {}
}
