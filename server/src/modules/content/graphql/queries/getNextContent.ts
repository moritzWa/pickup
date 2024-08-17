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
import {
    contentRepo,
    contentSessionRepo,
    interactionRepo,
    feedRepo,
} from "../../infra";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { QueueService } from "../../services/queueService/queueService";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { ContentService } from "../../services/contentService";

export const getNextContent = queryField("getNextContent", {
    type: nullable("FeedItem"),
    args: {
        afterContentId: nonNull(idArg()),
        currentMs: nullable(intArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { afterContentId } = args;
        const user = ctx.me!;

        const contentResponse = await contentRepo.findById(afterContentId);

        throwIfError(contentResponse);

        const content = contentResponse.value;

        const nextQueueResponse = await ContentService.next(user, content);

        throwIfError(nextQueueResponse);

        console.log(nextQueueResponse.value);

        if (nextQueueResponse.value) {
            await pgUserRepo.update(user.id, {
                currentFeedItemId: nextQueueResponse.value.item.id,
            });
        }

        return nextQueueResponse.value?.item ?? null;
    },
});
