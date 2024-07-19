import {
    idArg,
    list,
    mutationField,
    nonNull,
    nullable,
    queryField,
    stringArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { DateTime } from "luxon";
import { ApolloError } from "apollo-server-errors";
import { UserService } from "src/modules/users/services";
import { dateArg } from "src/core/surfaces/graphql/base";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Apollo } from "@sentry/tracing/types/integrations";
import { FeedPostService } from "../../services/feedPostService";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { Slack, SlackChannel } from "src/utils";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";

export const createFeedPost = mutationField("createFeedPost", {
    type: nonNull("FullFeedPost"),
    args: {
        content: nonNull(stringArg()),
        tokenId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { content, tokenId } = args;
        throwIfNotAuthenticated(ctx);
        const me = ctx.me!;

        // get the token
        const tokenResp = await TokenService.findOne({
            where: {
                id: tokenId,
            },
        });
        throwIfError(tokenResp);
        const token = tokenResp.value;

        // Create the post
        const createResp = await FeedPostService.create({
            content: args.content.trim(),
            userId: me.id,
            numLikes: 0,
            numComments: 0,
            tokenId,
        });
        throwIfError(createResp);
        const post = createResp.value;

        // log to slack
        await Slack.send({
            channel: SlackChannel.LogsFeeds,
            message: `New feed post created by ${me.username} for token ${token.name} (${token.symbol}, ${token.contractAddress}):\n\n${content}`,
        });

        // // get profile for feed posts
        // const profileResp = await UserService.findOne({
        //     select: ["id", "name", "username", "avatarImageUrl"],
        //     where: {
        //         id: me.id,
        //     },
        // });
        // throwIfError(profileResp);

        // merge
        const fullFeedPost: NexusGenObjects["FullFeedPost"] = {
            ...post,
            profile: {
                id: me.id,
                name: me.name || "Unnamed",
                avatarImageUrl: me.avatarImageUrl,
                username: me.username || "",
            },
        };

        return fullFeedPost;
    },
});
