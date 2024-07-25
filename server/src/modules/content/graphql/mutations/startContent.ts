import { ApolloError } from "apollo-server-errors";
import { StatusCodes } from "http-status-codes";
import { booleanArg, mutationField, nonNull, stringArg } from "nexus";
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

export const startContent = mutationField("startContent", {
    type: nonNull("ContentSession"),
    args: {
        contentId: nonNull(stringArg()),
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

        if (existingSessionResponse.isSuccess()) {
            return existingSessionResponse.value;
        }

        const content = contentResponse.value;

        const sessionResponse = await contentSessionRepo.create({
            id: uuidv4(),
            contentId: content.id,
            userId: user.id,
            timestampCursor: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log(sessionResponse);

        throwIfError(sessionResponse);

        const session = sessionResponse.value;

        return session;
    },
});
