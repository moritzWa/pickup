import * as jwt from "jsonwebtoken";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { config } from "../config";

const clientTokenSecret = config.jwtSecret; // same as in other file...
const ALGORITHM = "HS256";

export class Tokens {
    static generateToken(
        payload: any,
        expiresIn = "1d"
    ): FailureOrSuccess<DefaultErrors, string> {
        try {
            const result = jwt.sign(payload, clientTokenSecret, {
                algorithm: ALGORITHM,
                expiresIn: expiresIn,
            });

            return success(result);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    static async decryptToken(
        token: string
    ): Promise<FailureOrSuccess<DefaultErrors, any>> {
        return new Promise<any>((resolve, reject) => {
            jwt.verify(token, clientTokenSecret, (err, decodedToken) => {
                if (err) {
                    return reject(failure(new Error(err.message)));
                }
                return resolve(success(decodedToken));
            });
        });
    }
}
