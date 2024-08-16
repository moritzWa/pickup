import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import {
    booleanArg,
    idArg,
    intArg,
    mutationField,
    nonNull,
    nullable,
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
import { contentRepo, contentSessionRepo, interactionRepo } from "../../infra";
import BigNumber from "bignumber.js";
import { last } from "lodash";
import { dateArg } from "src/core/surfaces/graphql/base";
import { ContentInteractionService } from "../../services/contentInteractionService";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";

export const updateContentSession = mutationField("updateContentSession", {
    type: nonNull("ContentSession"),
    args: {
        contentSessionId: nonNull(idArg()),
        isBookmarked: nullable(booleanArg()),
        isLiked: nullable(booleanArg()),
        currentMs: nullable(intArg()),
        lastListenedAt: nullable(dateArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { contentSessionId, lastListenedAt } = args;
        const user = ctx.me!;

        const contentSessionResponse = await contentSessionRepo.findById(
            contentSessionId,
            { relations: { content: true } }
        );

        throwIfError(contentSessionResponse);

        const contentSession = contentSessionResponse.value;
        const durationMs = contentSession.content.lengthMs;

        const percentFinishedRaw = new BigNumber(
            contentSession.currentMs ?? 0
        ).div(durationMs ?? 0);

        const percentFinished = !percentFinishedRaw.isNaN()
            ? percentFinishedRaw.multipliedBy(100).dp(0)
            : null;

        const updateSessionResponse = await contentSessionRepo.update(
            contentSession.id,
            {
                isBookmarked: args.isBookmarked ?? contentSession.isBookmarked,
                isLiked: args.isLiked ?? contentSession.isLiked,
                currentMs: args.currentMs ?? contentSession.currentMs,
                percentFinished: percentFinished?.toNumber() ?? null,
                bookmarkedAt: args.isBookmarked
                    ? new Date()
                    : contentSession.bookmarkedAt,
                lastListenedAt: lastListenedAt ?? contentSession.lastListenedAt,
                updatedAt: new Date(),
            }
        );

        throwIfError(updateSessionResponse);

        const session = updateSessionResponse.value;

        // console.log(session.currentMs);

        // FIXME: just so it doesnt always try to create this event and fail (just tries between 15 - 30 second mark)
        if (
            session.currentMs &&
            new BigNumber(session.currentMs).gt(15_000) &&
            new BigNumber(session.currentMs).lt(30_000)
        ) {
            const response = await interactionRepo.create({
                id: uuidv4(),
                contentId: session.contentId,
                userId: user.id,
                type: InteractionType.ListenedToBeginning,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        if (
            percentFinished &&
            percentFinished.gte(70) &&
            percentFinished.lte(100)
        ) {
            await interactionRepo.create({
                id: uuidv4(),
                contentId: session.contentId,
                userId: user.id,
                type: InteractionType.Finished,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        return session;
    },
});
