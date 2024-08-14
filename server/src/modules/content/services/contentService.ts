import { openai } from "src/utils";
import { contentRepo } from "../infra";
import { failure, success, UnexpectedError } from "src/core/logic";
import { SimilarContentWithDistanceResponse } from "../infra/contentRepo";

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

export const ContentService = {
    getSimilarContent,
};
