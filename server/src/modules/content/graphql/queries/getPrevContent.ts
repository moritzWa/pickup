import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import {
    booleanArg,
    idArg,
    intArg,
    mutationField,
    nonNull,
    nullable,
    queryField,
    stringArg,
} from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { loops } from "src/utils/loops";
import { auth } from "firebase-admin";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { v4 as uuidv4 } from "uuid";
import { contentRepo, contentSessionRepo, queueRepo } from "../../infra";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { QueueService } from "../../services/queueService/queueService";

export const getPrevContent = queryField("getPrevContent", {
    type: nullable("Queue"),
    args: {
        beforeContentId: nonNull(idArg()),
        currentMs: nullable(intArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { beforeContentId } = args;
        const user = ctx.me!;

        const contentResponse = await contentRepo.findById(beforeContentId);

        throwIfError(contentResponse);

        const content = contentResponse.value;

        const prevQueueResponse = await QueueService.prev(user, content);

        throwIfError(prevQueueResponse);

        await pgUserRepo.update(user.id, {
            currentQueueId: prevQueueResponse.value.id,
        });

        return prevQueueResponse.value;
    },
});
