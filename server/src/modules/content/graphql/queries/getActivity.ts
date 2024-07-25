import { idArg, list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { lessonRepo } from "src/modules/lessons/infra";
import { contentSessionRepo } from "../../infra";

export const getActivity = queryField("getActivity", {
    type: nonNull(list(nonNull("ContentSession"))),
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const contentSessionsResponse = await contentSessionRepo.findForUser(
            user.id,
            {
                relations: {
                    content: true,
                },
            }
        );

        throwIfError(contentSessionsResponse);

        return contentSessionsResponse.value;
    },
});
