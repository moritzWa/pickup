import { openai } from "src/utils";
import { contentRepo, feedRepo } from "../infra";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { SimilarContentWithDistanceResponse } from "../infra/contentRepo";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { Content, FeedItem, User } from "src/core/infra/postgres/entities";
import { LessThan, MoreThan, MoreThanOrEqual } from "typeorm";

const getSimilarContent = async (
    query: string
): Promise<SimilarContentWithDistanceResponse> => {
    try {
        const embeddingResponse = await openai.embeddings.create(query);

        if (embeddingResponse.isFailure()) {
            return failure(embeddingResponse.error);
        }

        const embedding = embeddingResponse.value;

        const similarContentResponse = await contentRepo.findSimilarContent(
            embedding
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
): Promise<FailureOrSuccess<DefaultErrors, FeedItem>> => {
    const currentFeedItemResponse = await feedRepo.findOne({
        where: {
            userId: user.id,
            contentId: content.id,
        },
    });

    if (currentFeedItemResponse.isFailure()) {
        return failure(currentFeedItemResponse.error);
    }

    const currentFeedItem = currentFeedItemResponse.value;

    const [topOfQueueResponse, currentFeedResponse] = await Promise.all([
        feedRepo.topOfQueue(user.id, content.id),
        feedRepo.find({
            where: {
                userId: user.id,
                isQueued: false,
                position: MoreThan(currentFeedItem.position),
            },
            order: {
                position: "asc",
            },
            take: 1,
        }),
    ]);

    console.log("top of queue: " + topOfQueueResponse);

    if (topOfQueueResponse.isFailure()) {
        return failure(topOfQueueResponse.error);
    }

    const topOfQueue = topOfQueueResponse.value;

    if (topOfQueue) {
        return success(topOfQueue);
    }

    const feed = currentFeedResponse.value[0] ?? null;

    return success(feed);
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

export const ContentService = {
    getSimilarContent,
    enqueueContentForProcessing,
    chunkContent: splitTextIntoChunks,
    next,
    prev,
};
