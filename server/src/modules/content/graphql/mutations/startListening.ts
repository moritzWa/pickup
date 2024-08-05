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
import { courseProgressRepo } from "src/modules/courses/infra";
import { contentRepo, contentSessionRepo } from "../../infra";

export const startListening = mutationField("startListening", {
    type: nonNull("ContentSession"),
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        // TODO: make this actually find the best thing we can start playing for the person
        const contentResponse = await contentRepo.find({
            take: 1,
        });

        throwIfError(contentResponse);

        const content = contentResponse.value[0];

        const existingSessionResponse =
            await contentSessionRepo.findForContentAndUser({
                userId: user.id,
                contentId: content.id,
            });

        if (
            existingSessionResponse.isSuccess() &&
            existingSessionResponse.value
        ) {
            return existingSessionResponse.value;
        }

        const sessionResponse = await contentSessionRepo.create({
            id: uuidv4(),
            isBookmarked: false,
            isLiked: false,
            contentId: content.id,
            userId: user.id,
            currentMs: 0,
            durationMs: content.lengthMs,
            createdAt: new Date(),
            lastListenedAt: new Date(),
            bookmarkedAt: null,
            updatedAt: new Date(),
            percentFinished: null,
        });

        throwIfError(sessionResponse);

        const session = sessionResponse.value;

        return session;
    },
});
