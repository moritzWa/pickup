import {
    AlreadyExistsError,
    NonRetriableError,
    NotImplementError,
    UnexpectedError,
    ValidationError,
} from "./application";
import { FailedWriteError, NotFoundError } from "./domain";

export type DefaultErrors =
    | NotFoundError
    | UnexpectedError
    | Error
    | FailedWriteError
    | ValidationError
    | NotImplementError
    | NonRetriableError
    | AlreadyExistsError;
