import { booleanArg, idArg, mutationField, nonNull } from "nexus";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import {
    contentRepo,
    contentSessionRepo,
    feedRepo,
    interactionRepo,
} from "../../infra";
import { ContentSessionService } from "../../services/contentSessionService";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { v4 as uuidv4 } from "uuid";

export const addToQueue = mutationField("addToQueue", {
    type: nonNull("FeedItem"),
    args: {
        contentId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const { contentId } = args;

        const user = ctx.me!;

        const contentResponse = await contentRepo.findById(contentId);

        throwIfError(contentResponse);

        const content = contentResponse.value;

        const feedItemExistsResponse = await feedRepo.findOne({
            where: {
                userId: user.id,
                contentId,
            },
        });

        if (
            feedItemExistsResponse.isSuccess() &&
            feedItemExistsResponse.value
        ) {
            // update it to queued
            const feedItem = feedItemExistsResponse.value;

            const updateResponse = await feedRepo.update(feedItem.id, {
                isQueued: true,
                queuedAt: new Date(),
            });

            throwIfError(updateResponse);

            return feedItem;
        }

        const feedItemResponse = await feedRepo.create({
            id: uuidv4(),
            position: 0,
            queuedAt: new Date(),
            isArchived: false,
            isQueued: true,
            userId: user.id,
            contentId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        throwIfError(feedItemResponse);

        return feedItemResponse.value;
    },
});
