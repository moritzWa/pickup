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

export const generateUsernameV2 = queryField("generateUsernameV2", {
    type: nonNull("GenerateUsernameResponse"),
    args: {
        // username: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        // generate username
        const { username, name } = ProfileService.generateUsername();
        return { username, name };
    },
});
