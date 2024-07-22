import { list, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { stripe } from "src/utils";
import { lessonSessionRepo } from "../../infra";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const mySessions = queryField("mySessions", {
    type: nonNull(list(nonNull("Session"))),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const sessionsResponse = await lessonSessionRepo.findForUser(user.id);

        throwIfError(sessionsResponse);

        const sessions = sessionsResponse.value;

        return sessions;
    },
});
