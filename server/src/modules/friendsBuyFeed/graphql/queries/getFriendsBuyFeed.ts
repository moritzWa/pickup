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

export const getFriendsBuyFeed = queryField("getFriendsBuyFeed", {
    type: nonNull(list(nonNull("GetFriendsBuyFeedResponse"))),
    args: {
        userId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { userId } = args;
        throwIfNotAuthenticated(ctx);
        const me = ctx.me!;

        // check that user is the userId
        if (me.id !== userId) {
            throw new ApolloError("Unauthorized", "UNAUTHORIZED");
        }

        // get buy feed
        const feedResp = await FriendsBuyFeedService.getFriendsBuyFeed(userId);
        throwIfError(feedResp);
        const feed = feedResp.value;

        return feed;
    },
});
