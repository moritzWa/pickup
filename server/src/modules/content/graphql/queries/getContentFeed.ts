import { idArg, intArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonRepo } from "src/modules/lessons/infra";
import { contentRepo, contentSessionRepo } from "../../infra";

export const getContentFeed = queryField("getContentFeed", {
    type: nonNull(list(nonNull("Content"))),
    args: {
        limit: nullable(intArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { limit } = args;
        const user = ctx.me!;

        const contentResponse = await contentRepo.find({
            take: limit ?? 0,
        });

        console.log(contentResponse);

        throwIfError(contentResponse);

        return contentResponse.value;
    },
});
