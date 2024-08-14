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

export const ContentService = {
    getSimilarContent,
    enqueueContentForProcessing,
};
