import { idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonRepo } from "src/modules/lessons/infra";
import { contentSessionRepo } from "../../infra";

export const getContentSession = queryField("getContentSession", {
    type: nonNull("ContentSession"),
    args: {
        contentId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const contentId = args.contentId;

        const contentSession = await contentSessionRepo.findForContentAndUser({
            contentId,
            userId: user.id,
        });

        throwIfError(contentSession);

        return contentSession.value;
    },
});
