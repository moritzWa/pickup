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
import { DateTime } from "luxon";
import { FriendsBuyFeedService } from "../../services";
import { ApolloError } from "apollo-server-errors";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { UserService } from "src/modules/users/services";

export const getNumUnreadFriendsTxns = queryField("getNumUnreadFriendsTxns", {
    type: nonNull("Int"),
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

        // get user
        const userResp = await UserService.findById(userId);
        throwIfError(userResp);
        const user = userResp.value;

        // get buy feed
        const feedResp = await FriendsBuyFeedService.getFriendsBuyFeed(userId);
        throwIfError(feedResp);
        const feed = feedResp.value;

        // check if there are any unread
        const unreadTxns = feed.filter(
            (txn) =>
                DateTime.fromJSDate(txn.createdAt) >
                DateTime.fromJSDate(user.readFriendsUntil)
        );

        return unreadTxns.length;
    },
});
