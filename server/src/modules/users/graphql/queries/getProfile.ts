import { idArg, nonNull, nullable, queryField, stringArg } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { pgUserRepo, relationshipRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";
import { ProfileService } from "../../services/profileService";

export const getProfile = queryField("getProfile", {
    type: nonNull("Profile"),
    args: {
        username: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;

        const { username } = args;

        if (!username) {
            throw new ApolloError("User ID is required");
        }

        const userResponse = await pgUserRepo.findByUsername(username);

        throwIfError(userResponse);

        const user = userResponse.value;

        const [profileResponse, isFollowingResponse] = await Promise.all([
            ProfileService.getFollowersAndFollowing(user.id),
            relationshipRepo.isFollowing(user.id, me.id),
        ]);

        throwIfError(profileResponse);
        throwIfError(isFollowingResponse);

        const isFollowing = isFollowingResponse.value;
        const profile = profileResponse.value;

        return {
            id: user.id,
            username: user.username || "",
            name: user.name || "",
            description: user.description,
            numFollowers: profile.numFollowers,
            numFollowing: profile.numFollowing,
            avatarImageUrl: user.imageUrl,
            isFollowing: isFollowing,
        };
    },
});
