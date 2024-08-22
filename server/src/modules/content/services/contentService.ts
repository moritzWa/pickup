import { openai } from "src/utils";
import { contentRepo, contentSessionRepo, feedRepo } from "../infra";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    hasValue,
    Maybe,
    success,
    UnexpectedError,
} from "src/core/logic";
import { SimilarContentWithDistanceResponse } from "../infra/contentRepo";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { Content, FeedItem, User } from "src/core/infra/postgres/entities";
import { In, LessThan, MoreThan, MoreThanOrEqual } from "typeorm";
import { groupBy, keyBy, uniqBy } from "lodash";
import { pgUserRepo, relationshipRepo } from "src/modules/users/infra/postgres";

const getSimilarContentFromQuery = async (
    user: User,
    query: string,
    limit: number
): Promise<SimilarContentWithDistanceResponse> => {
    try {
        const feedResponse = await feedRepo.findForUser(user.id, {
            select: { contentId: true },
        });

        if (feedResponse.isFailure()) {
            return failure(feedResponse.error);
        }

        const contentIds = new Set<string>(
            feedResponse.value.map((f) => f.contentId)
        );

        const embeddingResponse = await openai.embeddings.create(query);

        if (embeddingResponse.isFailure()) {
            return failure(embeddingResponse.error);
        }

        const embedding = embeddingResponse.value;

        const similarContentResponse = await contentRepo.findSimilarContent(
            embedding,
            limit,
            Array.from(contentIds)
        );

        return similarContentResponse;
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getSimilarContent = async (
    user: User,
    content: Content,
    limit: number
): Promise<SimilarContentWithDistanceResponse> => {
    try {
        const feedResponse = await feedRepo.findForUser(user.id, {
            select: { contentId: true },
        });

        if (feedResponse.isFailure()) {
            return failure(feedResponse.error);
        }

        if (!content.embedding) {
            return failure(
                new UnexpectedError("Content does not have an embedding")
            );
        }

        const contentIds = new Set<string>(
            feedResponse.value.map((f) => f.contentId)
        );

        const similarContentResponse = await contentRepo.findSimilarContent(
            content.embedding,
            limit,
            Array.from(contentIds)
        );

        return similarContentResponse;
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const enqueueContentForProcessing = async (): Promise<
    FailureOrSuccess<DefaultErrors, null>
> => {
    const contentToProcessResponse = await contentRepo.find({
        where: { isProcessed: false },
    });

    if (contentToProcessResponse.isFailure()) {
        return failure(contentToProcessResponse.error);
    }

    const content = contentToProcessResponse.value;

    for (const c of content) {
        await inngest.send({
            name: InngestEventName.ProcessContent,
            data: { contentId: c.id },
        });
    }

    return success(null);
};

function splitTextIntoChunks(text: string, maxChunkSize = 8000): string[] {
    const chunks: string[] = [];
    const sentences = text.split(". ");

    let currentChunk = "";

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i] + (i < sentences.length - 1 ? ". " : ".");

        if (currentChunk.length + sentence.length > maxChunkSize) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += sentence;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

const next = async (
    user: User,
    content: Content
): Promise<
    FailureOrSuccess<DefaultErrors, Maybe<{ item: FeedItem; content: Content }>>
> => {
    const currentQueueResponse = await feedRepo.find({
        where: {
            userId: user.id,
            isQueued: true,
        },
        order: {
            queuedAt: "asc",
        },
        take: 2,
    });

    if (currentQueueResponse.isFailure()) {
        return failure(currentQueueResponse.error);
    }

    const queue = currentQueueResponse.value;

    if (!queue.length) {
        return success(null);
    }

    const contentIds = queue.map((q) => q.contentId);

    const contentResponse = await contentRepo.findByIds(contentIds, {
        relations: { authors: true },
    });

    if (contentResponse.isFailure()) {
        return failure(contentResponse.error);
    }

    const contentById = keyBy(contentResponse.value, (t) => t.id);
    const topOfQueue = queue[0];

    // remove content from the ueue
    await feedRepo.update(topOfQueue.id, {
        isQueued: false,
        queuedAt: null,
    });

    const nextUp = queue[1];

    if (!nextUp) {
        return success(null);
    }

    const newContent = contentById[nextUp.contentId];

    return success({
        item: { ...nextUp, content: newContent },
        content: newContent,
    });
};

// TODO: fix this...
const prev = async (
    user: User,
    content: Content
): Promise<FailureOrSuccess<DefaultErrors, FeedItem | null>> => {
    const currentQueueResponse = await feedRepo.findOne({
        where: {
            userId: user.id,
            contentId: content.id,
        },
    });

    if (currentQueueResponse.isFailure()) {
        return failure(currentQueueResponse.error);
    }

    const currentPos = currentQueueResponse.value.position;

    const prevItemResponse = await feedRepo.find({
        where: {
            userId: user.id,
            position: LessThan(currentPos),
        },
        take: 1,
        order: { position: "asc" },
        relations: { content: true },
    });

    if (prevItemResponse.isFailure()) {
        return failure(prevItemResponse.error);
    }

    const prevItem = prevItemResponse.value[0];

    if (!prevItem) {
        return success(null);
    }

    return success(prevItem);
};

const decorateContentWithFriends = async (
    user: User,
    content: Content[]
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        (Content & {
            friends: Partial<User>[];
        })[]
    >
> => {
    const relationshipResponse = await relationshipRepo.usersFollowing(user.id);

    if (relationshipResponse.isFailure()) {
        return failure(relationshipResponse.error);
    }

    const userIdsFollowing = relationshipResponse.value;

    const usersResponse = await pgUserRepo.findByIds(userIdsFollowing, {
        select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
        },
    });

    if (usersResponse.isFailure()) {
        return failure(usersResponse.error);
    }

    const usersFollowing = usersResponse.value;
    const finalContentIds = content.map((c) => c.id);

    const contentFromRelationships = await contentSessionRepo.find({
        where: {
            contentId: In(finalContentIds),
            userId: In(userIdsFollowing),
        },
        select: {
            id: true,
            userId: true,
            contentId: true,
        },
    });

    if (contentFromRelationships.isFailure()) {
        return failure(contentFromRelationships.error);
    }

    const sessions = contentFromRelationships.value;

    const sessionByContent = groupBy(sessions, (s) => s.contentId);
    const userById = keyBy(usersFollowing, (u) => u.id);

    const finalContent = content.map((c) => {
        const sessions = sessionByContent[c.id] ?? [];
        const users = sessions
            .map((s) => userById[s.userId])
            .filter(hasValue)
            .map((u) => ({ ...u, avatarImageUrl: u.imageUrl }));

        return {
            ...c,
            friends: users,
        };
    });

    // console.log(skip);
    // console.log(uniqContent.map((c) => c.title.slice(0, 3)));

    return success(uniqBy(finalContent, (c) => c.id));
};

export const ContentService = {
    getSimilarContent,
    getSimilarContentFromQuery,
    enqueueContentForProcessing,
    chunkContent: splitTextIntoChunks,
    next,
    prev,
    decorateContentWithFriends,
};
