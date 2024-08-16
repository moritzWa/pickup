import {
    booleanArg,
    idArg,
    mutationField,
    nonNull,
    nullable,
    objectType,
    stringArg,
} from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { ResponseService } from "../../services/respondService";
import { contentRepo } from "../../infra";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { buildQueue } from "../../services/queueService";

export const showMore = mutationField("showMore", {
    type: nonNull("String"),
    args: {
        // TODO:
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const response = await buildQueue(user, 10);

        console.log(response);

        return "Requested more queue items.";
    },
});
