import { mutationField, nonNull, stringArg } from "nexus";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Context } from "src/core/surfaces/graphql/context";
import { v4 as uuidv4 } from "uuid";
import { feedRepo, interactionRepo, contentRepo } from "../../infra";
import { ContentFromUrlService } from "../../services/contentFromUrlService";
import { Content } from "../types/Content";

/*

Example curl command:

curl -X POST http://localhost:8888/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createContentFromUrl(url: \"https://blog.dennishackethal.com/posts/libertarian-faq \") { id title websiteUrl content audioUrl thumbnailImageUrl } }"            

*/

export const createContentFromUrl = mutationField("createContentFromUrl", {
    type: nonNull(Content),
    args: {
        url: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context, _info) => {
        // throwIfNotAuthenticated(ctx); // accessible to all users for now

        const { url } = args;

        // Check if content with the given URL already exists
        const existingContentResponse = await contentRepo.findOne({
            where: { websiteUrl: url },
        });

        if (
            existingContentResponse.isSuccess() &&
            existingContentResponse.value
        ) {
            return existingContentResponse.value;
        }

        const contentResponse = await ContentFromUrlService.createFromUrl(url);
        if (contentResponse.isFailure()) {
            throw contentResponse.error;
        }

        const content = contentResponse.value;

        if (ctx.me) {
            const user = ctx.me;

            await interactionRepo.create({
                id: uuidv4(),
                contentId: content.id,
                userId: user.id,
                type: InteractionType.Queued,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const feedItemExistsResponse = await feedRepo.findOne({
                where: {
                    userId: user.id,
                    contentId: content.id,
                },
            });

            if (
                feedItemExistsResponse.isFailure() ||
                !feedItemExistsResponse.value
            ) {
                const feedItemResponse = await feedRepo.create({
                    id: uuidv4(),
                    position: 0,
                    queuedAt: new Date(),
                    isArchived: false,
                    isQueued: true,
                    userId: user.id,
                    contentId: content.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                throwIfError(feedItemResponse);
            } else {
                // feeditem already exists, update it
                const feedItem = feedItemExistsResponse.value;

                const updateResponse = await feedRepo.update(feedItem.id, {
                    isQueued: true,
                    queuedAt: new Date(),
                });

                throwIfError(updateResponse);
            }
        }

        return content;
    },
});
