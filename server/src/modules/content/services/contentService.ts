import { openai } from "src/utils";
import { contentRepo } from "../infra";
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

export const ContentService = {
    getSimilarContent,
    enqueueContentForProcessing,
    chunkContent: splitTextIntoChunks,
};
