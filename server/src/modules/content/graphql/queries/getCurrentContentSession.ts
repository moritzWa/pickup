import { idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonRepo } from "src/modules/lessons/infra";
import { contentSessionRepo } from "../../infra";

export const getCurrentContentSession = queryField("getCurrentContentSession", {
    type: nullable("ContentSession"),
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        if (!user.currentContentSessionId) {
            return null;
        }

        const contentSession = await contentSessionRepo.findById(
            user.currentContentSessionId,
            {
                relations: { content: true },
            }
        );

        throwIfError(contentSession);

        return contentSession.value;
    },
});
