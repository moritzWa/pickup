import { IError } from "./IError";

export class UseCaseError implements IError {
    readonly type = "UseCaseError";

    constructor(readonly message: string, readonly error?: unknown) {}
}
