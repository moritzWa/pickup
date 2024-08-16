import { enumType, idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentRepo, contentSessionRepo, feedRepo } from "../../infra";
import { keyBy, omit, uniqBy } from "lodash";
import { In } from "typeorm";

export const getArchived = queryField("getArchived", {
    type: nonNull(list(nonNull("Content"))),
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const feedResponse = await feedRepo.findForUser(user.id, {
            where: {
                isArchived: true,
            },
            order: {
                updatedAt: "desc",
            },
            take: 100,
        });

        throwIfError(feedResponse);

        // find the content and populate the feed
        const contentResponse = await contentRepo.find({
            where: {
                id: In(feedResponse.value.map((f) => f.contentId)),
            },
            relations: { authors: true },
        });

        throwIfError(contentResponse);

        const contentById = keyBy(contentResponse.value, (v) => v.id);

        const content = feedResponse.value.map((f) => {
            const c = contentById[f.contentId];

            return c;
        });

        return uniqBy(content, (v) => v.id);
    },
});
