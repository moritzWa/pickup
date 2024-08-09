import { idArg, intArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentSessionRepo } from "../../infra";
import { omit } from "lodash";

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
                relations: { content: true },
            }
        );

        throwIfError(contentSessionsResponse);

        const content = contentSessionsResponse.value.map((cs) => ({
            ...cs.content,
            contentSession: omit(cs, ["content"]),
        }));

        return content;
    },
});
