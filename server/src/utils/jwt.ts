import * as JWT from "jsonwebtoken";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";

interface Payload {
    [key: string]: any;
}

// Function to sign a JWT token
function signToken(
    payload: Payload,
    secretKey: string,
    expiresIn: string | number
): FailureOrSuccess<DefaultErrors, string> {
    try {
        const token = JWT.sign(payload, secretKey, { expiresIn });
        return success(token);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
}

// Function to parse/verify a JWT token
function parseToken(
    token: string,
    secretKey: string
): FailureOrSuccess<DefaultErrors, Payload> {
    try {
        const decoded = JWT.verify(token, secretKey) as Payload;
        return success(decoded);
    } catch (error) {
        return failure(new UnexpectedError("Couldn't parse token."));
    }
}

export const jwt = {
    signToken,
    parseToken,
};
