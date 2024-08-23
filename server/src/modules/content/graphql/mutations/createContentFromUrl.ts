import { arg, mutationField, nonNull, stringArg } from "nexus";
import {
    Content as ContentEntity,
    User,
} from "src/core/infra/postgres/entities";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Context } from "src/core/surfaces/graphql/context";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { Logger } from "src/utils";
import { v4 as uuidv4 } from "uuid";
import { contentRepo, feedRepo, interactionRepo } from "../../infra";
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
        authProviderId: arg({ type: "String" }),
    },
    resolve: async (_parent, args, ctx: Context, _info) => {
        const { url, authProviderId } = args;
        Logger.info(
            `createContentFromUrl called with url: ${url}, authProviderId: ${authProviderId}`
        );

        let content: ContentEntity;
        let user = await getUserFromContextOrAuthProviderId(
            ctx,
            authProviderId
        );

        // Check if content with the given URL already exists
        const existingContentResponse = await contentRepo.findOne({
            where: { websiteUrl: url },
        });

        if (
            existingContentResponse.isSuccess() &&
            existingContentResponse.value
        ) {
            Logger.info(
                `Content already exists for url: ${url}, returning existing content`
            );
            content = existingContentResponse.value;
        } else {
            const contentResponse = await ContentFromUrlService.createFromUrl(
                url
            );
            if (contentResponse.isFailure()) {
                throw contentResponse.error;
            }
            content = contentResponse.value;
            Logger.info(`New content created for url: ${url}`);
        }

        if (user) {
            await addContentToUserQueue(user, content);
            Logger.info(`Content added to queue for user: ${user.id}`);
        } else {
            Logger.info(`No user found to add content to queue`);
        }

        return content;
    },
});

async function getUserFromContextOrAuthProviderId(
    ctx: Context,
    authProviderId?: string | null
): Promise<User | null> {
    if (ctx.me) {
        return ctx.me;
    }
    if (authProviderId) {
        const userResponse = await pgUserRepo.findOne({
            where: { authProviderId },
        });
        if (userResponse.isSuccess() && userResponse.value) {
            return userResponse.value;
        }
    }
    return null;
}

async function addContentToUserQueue(user: User, content: ContentEntity) {
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

    if (feedItemExistsResponse.isFailure() || !feedItemExistsResponse.value) {
        const feedItemResponse = await feedRepo.create({
            id: uuidv4(),
            insertionId: null,
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
        Logger.info(
            `New feed item created for user ${user.id} and content ${content.id}`
        );
    } else {
        const feedItem = feedItemExistsResponse.value;
        const updateResponse = await feedRepo.update(feedItem.id, {
            isQueued: true,
            queuedAt: new Date(),
        });

        throwIfError(updateResponse);
        Logger.info(
            `Existing feed item updated for user ${user.id} and content ${content.id}`
        );
    }
}
