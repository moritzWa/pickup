import { nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { ApolloError } from "apollo-server-errors";
import { argsToArgsConfig } from "graphql/type/definition";

export const getIntercomMobileToken = queryField("getIntercomMobileToken", {
    type: nonNull("String"),
    args: {
        platform: nullable("String"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        if (args.platform === "android") {
            const hash = _getIntercomUseHash(
                config.intercom.androidSecretKey,
                ctx.authedUser!.id
            );

            if (!hash) {
                console.log("Failed to generate hash");
                throw new ApolloError("Failed to generate hash");
            }

            return hash;
        }

        const hash = _getIntercomUseHash(
            config.intercom.iosSecretKey,
            ctx.authedUser!.id
        );

        if (!hash) {
            console.log("Failed to generate hash");
            throw new ApolloError("Failed to generate hash");
        }

        return hash;
    },
});

const _getIntercomUseHash = (secret: string, userId: string): Maybe<string> => {
    try {
        const hash = crypto
            .createHmac("sha256", secret)
            .update(userId)
            .digest("hex");

        return hash;
    } catch (err) {
        return null;
    }
};
