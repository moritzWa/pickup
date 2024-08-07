import { idArg, intArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentSessionRepo } from "../../infra";

export const getLikes = queryField("getLikes", {
    type: nonNull(list(nonNull("ContentSession"))),
    args: {
        limit: nullable(intArg()),
        page: nullable(intArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { limit, page } = args;
        const user = ctx.me!;

        const contentSessionsResponse = await contentSessionRepo.findLikes(
            user.id,
            {
                take: limit ?? 20,
                skip: page ?? 0,
                order: { bookmarkedAt: "desc" },
            }
        );

        throwIfError(contentSessionsResponse);

        return contentSessionsResponse.value;
    },
});
