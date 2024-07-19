import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import {
    booleanArg,
    mutationField,
    nonNull,
    nullable,
    objectType,
    stringArg,
} from "nexus";
import {
    User,
    UserAuthProvider,
    UserStatus,
} from "src/core/infra/postgres/entities/User";
import { UserService } from "../../services";
import { v4 as uuidv4 } from "uuid";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { isNil } from "lodash";
import * as crypto from "crypto";

export const VerifyBiometricResponse = objectType({
    name: "VerifyBiometricResponse",
    definition(t) {
        t.nonNull.string("status");
        t.nullable.string("message");
    },
});

export const verifyBiometric = mutationField("verifyBiometric", {
    type: nonNull("VerifyBiometricResponse"),
    args: {
        signature: nonNull("String"),
        payload: nonNull("String"),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const userId = user.id;
        const biometricPublicKey = user.biometricPublicKey;
        const { signature, payload } = args;

        const verifier = crypto.createVerify("RSA-SHA256");

        verifier.update(payload);

        const isVerified = verifier.verify(
            `-----BEGIN PUBLIC KEY-----\n${biometricPublicKey}\n-----END PUBLIC KEY-----`,
            signature,
            "base64"
        );

        if (!isVerified) {
            return {
                status: "failed",
                message: "We could not verify your Face ID authentication",
            };
        }

        return {
            status: "success",
        };
    },
});
