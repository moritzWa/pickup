import { UnexpectedError } from "./application";
import { NotFoundError, ValidationError } from "./domain";

export type DefaultErrors =
  | ValidationError
  | Error
  | NotFoundError
  | UnexpectedError;
