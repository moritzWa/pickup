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

export const generateUsername = queryField("generateUsername", {
    type: nonNull("String"),
    args: {
        // username: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        // generate username
        const { username } = ProfileService.generateUsername();
        return username;
    },
});
