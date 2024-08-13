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

export const archiveContent = mutationField("archiveContent", {
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

        const feedItemResponse = await feedRepo.findOne({
            where: {
                contentId: content.id,
                userId: user.id,
                isArchived: false,
            },
        });

        throwIfError(feedItemResponse);

        const updatedFeedItemResponse = await feedRepo.update(
            feedItemResponse.value.id,
            {
                isArchived: true,
                isQueued: false,
            }
        );

        throwIfError(updatedFeedItemResponse);

        return updatedFeedItemResponse.value;
    },
});
