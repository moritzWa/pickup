import {
    list,
    mutationField,
    nonNull,
    nullable,
    objectType,
    queryField,
    stringArg,
} from "nexus";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { ProfileService } from "../../services";
import { ApolloError } from "apollo-server-errors";

export const checkValidUsername = queryField("checkValidUsername", {
    type: nonNull("String"),
    args: {
        username: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { username: _username } = args;
        const username = ProfileService.sanitizeUsername(_username);
        const user = ctx.me;

        // check username
        const isValidResp = await ProfileService.checkValidUsername(
            username,
            user
        );
        if (isValidResp.isFailure()) {
            throw new Error(isValidResp.error.message);
        }

        return "OK";
    },
});
