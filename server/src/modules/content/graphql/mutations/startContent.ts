import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import { booleanArg, idArg, mutationField, nonNull, stringArg } from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { loops } from "src/utils/loops";
import { auth } from "firebase-admin";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { v4 as uuidv4 } from "uuid";
import { contentRepo, contentSessionRepo, interactionRepo } from "../../infra";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";

export const startContent = mutationField("startContent", {
    type: nonNull("ContentSession"),
    args: {
        contentId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { contentId } = args;
        const user = ctx.me!;

        const contentResponse = await contentRepo.findById(contentId);

        throwIfError(contentResponse);

        const existingSessionResponse =
            await contentSessionRepo.findForContentAndUser({
                userId: user.id,
                contentId,
            });

        if (
            existingSessionResponse.isSuccess() &&
            existingSessionResponse.value
        ) {
            await pgUserRepo.update(user.id, {
                currentContentSessionId: existingSessionResponse.value.id,
            });

            await contentSessionRepo.update(existingSessionResponse.value.id, {
                lastListenedAt: new Date(),
            });

            return existingSessionResponse.value;
        }

        const content = contentResponse.value;

        const sessionResponse = await contentSessionRepo.create({
            id: uuidv4(),
            isBookmarked: false,
            isLiked: false,
            contentId: content.id,
            userId: user.id,
            lastListenedAt: new Date(),
            bookmarkedAt: null,
            currentMs: 0,
            durationMs: content.lengthMs,
            createdAt: new Date(),
            updatedAt: new Date(),
            percentFinished: null,
            notes: null,
        });

        throwIfError(sessionResponse);

        const session = sessionResponse.value;

        await pgUserRepo.update(user.id, {
            currentContentSessionId: session.id,
        });

        await interactionRepo.create({
            id: uuidv4(),
            contentId: content.id,
            userId: user.id,
            type: InteractionType.StartedListening,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return session;
    },
});
