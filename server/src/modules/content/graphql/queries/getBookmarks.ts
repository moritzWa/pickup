import { idArg, intArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentRepo, contentSessionRepo } from "../../infra";
import { keyBy, omit, uniqBy } from "lodash";
import { In } from "typeorm";

export const getBookmarks = queryField("getBookmarks", {
    type: nonNull(list(nonNull("Content"))),
    args: {
        limit: nullable(intArg()),
        page: nullable(intArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { limit, page } = args;
        const user = ctx.me!;

        const contentSessionsResponse = await contentSessionRepo.findBookmarks(
            user.id,
            {
                take: limit ?? 20,
                skip: page ?? 0,
                order: { bookmarkedAt: "desc" },
            }
        );

        throwIfError(contentSessionsResponse);

        // find the content and populate the feed
        const contentResponse = await contentRepo.find({
            where: {
                id: In(contentSessionsResponse.value.map((f) => f.contentId)),
            },
            relations: { authors: true },
        });

        throwIfError(contentResponse);

        const contentById = keyBy(contentResponse.value, (v) => v.id);

        const content = contentSessionsResponse.value.map((f) => {
            const c = contentById[f.contentId];

            return {
                ...c,
                contentSession: f,
            };
        });

        return uniqBy(content, (v) => v.id);
    },
});
