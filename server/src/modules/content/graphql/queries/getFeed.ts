import {
    enumType,
    idArg,
    intArg,
    list,
    nonNull,
    nullable,
    queryField,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentRepo, contentSessionRepo, feedRepo } from "../../infra";
import { In } from "typeorm";
import { keyBy } from "lodash";

export const ContentFeedFilter = enumType({
    name: "ContentFeedFilter",
    members: ["popular", "for_you", "new", "unread", "queue", "archived"],
});

export const getFeed = queryField("getFeed", {
    type: nonNull(list(nonNull("Content"))),
    args: {
        limit: nullable(intArg()),
        filter: nullable("ContentFeedFilter"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        // console.log(args);

        const { limit } = args;
        const user = ctx.me!;

        const feedResponse = await feedRepo.findForUser(user.id, {
            where: { isArchived: false },
            take: limit ?? 0,
            relations: { content: true },
            order: {
                position: "asc",
                createdAt: "desc",
            },
        });

        throwIfError(feedResponse);

        // Note: just doing in memory, lil easier than fiddling with typeorm

        const contentIds = feedResponse.value.map((c) => c.contentId);

        const contentSessionsResponse = await contentSessionRepo.find({
            where: {
                userId: user.id,
                contentId: In(contentIds),
            },
        });

        throwIfError(contentSessionsResponse);

        const sessionByContentId = keyBy(
            contentSessionsResponse.value,
            (cs) => cs.contentId
        );

        const content = feedResponse.value.map((c) => {
            const session = sessionByContentId[c.id];
            const content = c.content;

            return {
                ...content,
                contentSession: session,
            };
        });

        return content;
    },
});
