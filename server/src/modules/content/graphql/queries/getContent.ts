import { idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { contentRepo, contentSessionRepo } from "../../infra";
import { ContentSessionService } from "../../services/contentSessionService";

export const getContent = queryField("getContent", {
    type: nonNull("Content"),
    args: {
        contentId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const contentId = args.contentId;

        const contentResponse = await contentRepo.findById(contentId, {
            relations: {
                authors: true,
            },
        });

        throwIfError(contentResponse);

        const sessionResponse = await ContentSessionService.findOrCreate(
            contentResponse.value,
            user
        );

        throwIfError(sessionResponse);

        const session = sessionResponse.value;
        const content = contentResponse.value;

        return {
            ...content,
            contentSession: session,
        };
    },
});
