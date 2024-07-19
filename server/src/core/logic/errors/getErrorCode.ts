import { DefaultErrors } from "./default";
import { StatusCodes } from "http-status-codes";

export const getErrorCode = (error: DefaultErrors) => {
    // Note: should fix any cast bc default errors includes "Error", but for now
    // it is whatever
    switch ((error as any).type) {
        case "NotFoundError":
            return StatusCodes.NOT_FOUND.toString();
        case "UnexpectedError":
        default:
            return StatusCodes.INTERNAL_SERVER_ERROR.toString();
    }
};
