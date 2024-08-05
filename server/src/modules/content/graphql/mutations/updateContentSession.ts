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
import { courseProgressRepo } from "src/modules/courses/infra";
import { contentRepo, contentSessionRepo } from "../../infra";
import BigNumber from "bignumber.js";

export const updateContentSession = mutationField("updateContentSession", {
    type: nonNull("ContentSession"),
    args: {
        contentSessionId: nonNull(idArg()),
        isBookmarked: nullable(booleanArg()),
        isLiked: nullable(booleanArg()),
        currentMs: nullable(intArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { contentSessionId } = args;
        const user = ctx.me!;

        const contentSessionResponse = await contentSessionRepo.findById(
            contentSessionId,
            {}
        );

        throwIfError(contentSessionResponse);

        const contentSession = contentSessionResponse.value;

        const percentFinishedRaw = new BigNumber(
            contentSession.currentMs ?? 0
        ).div(contentSession.durationMs ?? 0);

        const percentFinished = !percentFinishedRaw.isNaN()
            ? percentFinishedRaw.multipliedBy(100).dp(0).toNumber()
            : null;

        const updateSessionResponse = await contentSessionRepo.update(
            contentSession.id,
            {
                isBookmarked: args.isBookmarked ?? contentSession.isBookmarked,
                isLiked: args.isLiked ?? contentSession.isLiked,
                currentMs: args.currentMs ?? contentSession.currentMs,
                percentFinished: percentFinished,
                bookmarkedAt: args.isBookmarked
                    ? new Date()
                    : contentSession.bookmarkedAt,
                updatedAt: new Date(),
            }
        );

        throwIfError(updateSessionResponse);

        const session = updateSessionResponse.value;

        return session;
    },
});
