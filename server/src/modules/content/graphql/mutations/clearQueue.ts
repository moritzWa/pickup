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

export const clearQueue = mutationField("clearQueue", {
    type: nonNull("String"),
    args: {},
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const feedResponse = await feedRepo.find({
            where: { userId: user.id, isQueued: true },
        });

        throwIfError(feedResponse);

        const feedItems = feedResponse.value;

        // update all to isQueued: false
        await Promise.all(
            feedItems.map(async (feedItem) => {
                const updatedFeedItemResponse = await feedRepo.update(
                    feedItem.id,
                    {
                        isQueued: false,
                        isArchived: false,
                    }
                );

                throwIfError(updatedFeedItemResponse);
            })
        );

        return "Successfully cleared the queue.";
    },
});
