import {
    idArg,
    list,
    mutationField,
    nonNull,
    nullable,
    objectType,
    queryField,
    stringArg,
} from "nexus";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { FeedPostService } from "../../services/feedPostService";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ProfileService } from "src/modules/profile/services";
import { UserService } from "src/modules/users/services";
import { In } from "typeorm";
import _ = require("lodash");
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";

export const getFeedPosts = queryField("getFeedPosts", {
    type: nonNull(list(nonNull("FullFeedPost"))),
    args: {
        tokenId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { tokenId } = args;
        // throwIfNotAuthenticated(ctx); <- no auth needed

        // get feed posts
        const feedPostsResp = await FeedPostService.find({
            where: {
                tokenId,
            },
            order: {
                createdAt: "DESC",
            },
        });
        throwIfError(feedPostsResp);
        const feedPosts = feedPostsResp.value;

        // get profiles for feed posts
        const profileIds = _.uniq(feedPosts.map((post) => post.userId));
        const profilesResp = await UserService.find({
            select: ["id", "name", "username", "avatarImageUrl"],
            where: {
                id: In(profileIds),
            },
        });
        throwIfError(profilesResp);
        const profiles = profilesResp.value;
        const profileByUserId = _.keyBy(profiles, "id");

        // merge
        const fullFeedPosts: NexusGenObjects["FullFeedPost"][] = feedPosts.map(
            (post) => {
                const profile = profileByUserId[post.userId];
                return {
                    ...post,
                    profile: {
                        id: profile.id,
                        name: profile.name || "Unnamed",
                        avatarImageUrl: profile.avatarImageUrl,
                        username: profile.username || "",
                    },
                };
            }
        );

        return fullFeedPosts;
    },
});
