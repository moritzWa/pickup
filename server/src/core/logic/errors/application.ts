import { isString } from "radash";
import { IError } from "./IError";

export class UnexpectedError implements IError {
    public readonly type = "UnexpectedError";

    constructor(readonly error?: Error | unknown, readonly data?: unknown) {}

    public get message(): string {
        if (this.error instanceof Error) {
            return this.error.message;
        }

        if (isString(this.error)) {
            return this.error as string;
        }

        if (!!(this.error as any)?.message) {
            return (this.error as any).message;
        }

        return "An unexpected error occurred.";
    }
}

export class ValidationError implements IError {
    public readonly type = "ValidationError";

    constructor(readonly error?: Error | unknown, readonly data?: unknown) {}

    public get message(): string {
        if (this.error instanceof Error) {
            return this.error.message;
        }

        if (isString(this.error)) {
            return this.error as string;
        }

        return "An validation error occurred.";
    }
}

export class AlreadyExistsError implements IError {
    public readonly type = "AlreadyExistsError";

    constructor(readonly error?: Error | unknown, readonly data?: unknown) {}

    public get message(): string {
        if (this.error instanceof Error) {
            return this.error.message;
        }

        if (isString(this.error)) {
            return this.error as string;
        }

        return "It already exists.";
    }
}

export class NotImplementError implements IError {
    public readonly type = "NotImplementError";

    constructor(readonly error?: Error | unknown, readonly data?: unknown) {}

    public get message(): string {
        if (this.error instanceof Error) {
            return this.error.message;
        }

        if (isString(this.error)) {
            return this.error as string;
        }

        return "Not implemented yet.";
    }
}

export class NonRetriableError implements IError {
    public readonly type = "NonRetriableError";

    constructor(readonly error?: Error | unknown, readonly data?: unknown) {}

    public get message(): string {
        if (this.error instanceof Error) {
            return this.error.message;
        }

        if (isString(this.error)) {
            return this.error as string;
        }

        return "Non retriable error.";
    }
}
