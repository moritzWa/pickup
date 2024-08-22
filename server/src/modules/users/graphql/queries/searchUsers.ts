import {
    list,
    mutationField,
    nonNull,
    objectType,
    queryField,
    stringArg,
} from "nexus";
import { ProfileService } from "../../services/profileService";
import { pgUserRepo, relationshipRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ContentService } from "src/modules/content/services/contentService";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";

export const UserSearchResult = objectType({
    name: "UserSearchResult",
    definition: (t) => {
        t.nonNull.id("id");
        t.nullable.string("username");
        t.nullable.string("avatarImageUrl");
        t.nullable.string("name");
        t.nullable.boolean("isFollowing");
    },
});

export const searchUsers = queryField("searchUsers", {
    type: nonNull(list(nonNull("UserSearchResult"))),
    args: {
        query: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { query } = args;
        const user = ctx.me!;

        if (!query) {
            return [];
        }

        // check username
        const userResponse = await pgUserRepo.findBySimilarUsername(query);

        throwIfError(userResponse);

        const relationshipResponse = await relationshipRepo.usersFollowing(
            user.id
        );

        throwIfError(relationshipResponse);

        const userIdsFollowing = new Set(relationshipResponse.value);

        return userResponse.value.map(
            (u): NexusGenObjects["UserSearchResult"] => ({
                ...u,
                avatarImageUrl: u.imageUrl,
                isFollowing: userIdsFollowing.has(u.id),
            })
        );
    },
});
