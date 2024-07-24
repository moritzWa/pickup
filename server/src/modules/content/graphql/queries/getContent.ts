import { idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonRepo } from "src/modules/lessons/infra";
import { contentRepo, contentSessionRepo } from "../../infra";

export const getContent = queryField("getContent", {
    type: nonNull("Content"),
    args: {
        contentId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const contentId = args.contentId;

        const contentResponse = await contentRepo.findById(contentId);

        throwIfError(contentResponse);

        return contentResponse.value;
    },
});
