import { mutationField, nonNull } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { v4 as uuidv4 } from "uuid";
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
            await pgUserRepo.update(user.id, {
                currentContentSessionId: existingSessionResponse.value.id,
            });

            return existingSessionResponse.value;
        }

        const sessionResponse = await contentSessionRepo.create({
            id: uuidv4(),
            isBookmarked: false,
            isLiked: false,
            isDisliked: false,
            contentId: content.id,
            userId: user.id,
            currentMs: 0,
            durationMs: content.lengthMs,
            createdAt: new Date(),
            lastListenedAt: new Date(),
            bookmarkedAt: null,
            dislikedAt: null,
            notes: null,
            updatedAt: new Date(),
            percentFinished: null,
        });

        throwIfError(sessionResponse);

        const session = sessionResponse.value;

        await pgUserRepo.update(user.id, {
            currentContentSessionId: session.id,
        });

        return session;
    },
});
