import { ApolloError } from "apollo-server-errors";
import { nonNull, queryField, stringArg } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { UserService } from "src/modules/users/services";
import { ProfileService } from "../../services";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { Relationship } from "src/core/infra/postgres/entities";
import { Maybe } from "src/core/logic";

export const getProfile = queryField("getProfile", {
    type: nonNull("GetProfileResponse"),
    args: {
        username: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { username } = args;
        const user = ctx.me; // NOTE: does not always exist, not calling throwIfNotAuthenticated

        if (!username)
            throw new ApolloError("Username is required", "USERNAME_REQUIRED");

        // get user
        const profileUserResp = await UserService.findByUsername(username);
        throwIfError(profileUserResp);
        if (profileUserResp.value.length === 0)
            throw new ApolloError("User not found", "USER_NOT_FOUND");
        const profileUser = profileUserResp.value[0];

        // get followers + following counts
        const relationshipsResp = await ProfileService.getFollowersAndFollowing(
            profileUser.id
        );
        throwIfError(relationshipsResp);
        const { numFollowers, numFollowing, followers } =
            relationshipsResp.value;

        // get relationship if it's not for this user
        let relationship: Maybe<Relationship> = null;
        if (user && user.id !== profileUser.id) {
            const relationshipResp = await ProfileService.relationships.find({
                where: {
                    fromUserId: user.id,
                    toUserId: profileUser.id,
                },
            });
            throwIfError(relationshipResp);
            relationship =
                relationshipResp.value.length > 0
                    ? relationshipResp.value[0]
                    : null;
        }

        // isFollowing
        const isFollowing =
            !!user &&
            followers.filter((f) => f.fromUserId === user.id).length > 0;

        return {
            id: profileUser.id,
            avatarImageUrl: profileUser.avatarImageUrl || "",
            username: profileUser.username || "",
            name: profileUser.name || "",
            numFollowers,
            numFollowing,
            isFollowing,
            description: profileUser.description,
            relationship,
        };
    },
});
