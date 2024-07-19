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
import { ProfileService } from "../../services";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const unfollowProfile = mutationField("unfollowProfile", {
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

        // unfollow user
        const followUserResp = await ProfileService.unfollowUser(
            profileUser.id,
            user.id
        );
        throwIfError(followUserResp);

        return "OK";
    },
});
