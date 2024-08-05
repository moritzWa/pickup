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
import { lessonRepo } from "src/modules/lessons/infra";
import { contentRepo, contentSessionRepo } from "../../infra";
import { In } from "typeorm";
import { keyBy } from "lodash";

export const ContentFeedFilter = enumType({
    name: "ContentFeedFilter",
    members: ["popular", "for_you", "new"],
});

export const getContentFeed = queryField("getContentFeed", {
    type: nonNull(list(nonNull("Content"))),
    args: {
        limit: nullable(intArg()),
        filter: nullable("ContentFeedFilter"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { limit } = args;
        const user = ctx.me!;

        const contentResponse = await contentRepo.find({
            take: limit ?? 0,
        });

        throwIfError(contentResponse);

        // Note: just doing in memory, lil easier than fiddling with typeorm

        const contentIds = contentResponse.value.map((c) => c.id);

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

        const content = contentResponse.value.map((c) => {
            const session = sessionByContentId[c.id];

            return {
                ...c,
                contentSession: session,
            };
        });

        return content;
    },
});
