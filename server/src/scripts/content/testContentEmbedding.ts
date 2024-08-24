import { OpenAI } from "openai";
import * as pgvector from "pgvector/pg";
import { dataSource } from "src/core/infra/postgres";
import { contentRepo } from "src/modules/content/infra";
import { Logger } from "src/utils/logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const searchAndFindSimilarArticles = async (searchString: string) => {
    await dataSource.initialize();

    try {
        // Embed the search string
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            dimensions: 256,
            input: searchString,
            encoding_format: "float",
        });

        if (embeddingResponse.data.length === 0) {
            throw new Error("Failed to generate embedding for search string.");
        }

        const embedding = embeddingResponse.data[0].embedding;

        // Find similar content
        const similarContentResponse =
            await contentRepo.findSimilarContentFromChunks(
                pgvector.toSql(embedding),
                10, // limit
                [] // idsToExclude
            );

        if (similarContentResponse.isFailure()) {
            throw new Error(
                `Failed to find similar content: ${similarContentResponse.error}`
            );
        }

        const similarContent = similarContentResponse.value;
        Logger.info(`Found ${similarContent.length} similar articles:`);
        similarContent.forEach((content, index) => {
            Logger.info(
                `${index + 1}. ${content.title} (Distance: ${
                    content.minDistance
                })`
            );
        });
    } catch (error) {
        Logger.error("Error during search and find similar articles:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

const searchString = "Your hardcoded search string here";
searchAndFindSimilarArticles(searchString).catch((error) =>
    Logger.error("Unhandled error:", error)
);
