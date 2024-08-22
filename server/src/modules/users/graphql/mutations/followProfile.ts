import {
    mutationField,
    nullable,
    objectType,
    nonNull,
    stringArg,
    idArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { UserService } from "src/modules/users/services";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ProfileService } from "../../services/profileService";

export const followProfile = mutationField("followProfile", {
    type: nonNull("String"),
    args: {
        username: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { username } = args;
        throwIfNotAuthenticated(ctx);
        const user = ctx.me!;

        // get user from username
        const userResp = await UserService.findOne({
            where: {
                username,
            },
        });
        throwIfError(userResp);
        const profileUser = userResp.value;

        // follow user
        const followUserResp = await ProfileService.followUser(
            profileUser,
            user
        );
        throwIfError(followUserResp);

        return "OK";
    },
});
