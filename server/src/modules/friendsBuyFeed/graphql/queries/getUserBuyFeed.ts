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
import { FriendsBuyFeedService } from "../../services";
import { ApolloError } from "apollo-server-errors";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const getUserBuyFeed = queryField("getUserBuyFeed", {
    type: nonNull(list(nonNull("GetFriendsBuyFeedResponse"))),
    args: {
        userId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { userId } = args;
        const isMe = !!(ctx.me && ctx.me.id === userId);
        // throwIfNotAuthenticated(ctx); <- users who are not logged in should be able to see

        // get buy feed
        const feedResp = await FriendsBuyFeedService.getUserFeed(userId, isMe);

        throwIfError(feedResp);

        const feed = feedResp.value;

        return feed;
    },
});
