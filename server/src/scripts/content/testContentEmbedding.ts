import { OpenAI } from "openai";
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
                embedding,
                10, // limit
                [] // idsToExclude
            );

        if (similarContentResponse.isFailure()) {
            Logger.error(
                `Failed to find similar content: ${JSON.stringify(
                    similarContentResponse.error
                )}`
            );
            return;
        }

        const similarContent = similarContentResponse.value;
        Logger.info(`Found ${similarContent.length} similar articles:`);
        similarContent.forEach((content, index) => {
            Logger.info(
                `${index + 1} . Title: ${content.title}, Website URL: ${
                    content.websiteUrl
                }, Distance: ${content.minDistance})`
            );
        });
    } catch (error) {
        Logger.error(`Error during search and find similar articles: ${error}`);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

const searchString =
    "Economics is a moral philosophy, not just a science. Reducing labor to mere metrics harms workers and communities by detaching employers from their moral responsibilities. Globalization worsens this by allowing shareholders to neglect local accountability, undermining the natural connection between employers and their labor force.";
searchAndFindSimilarArticles(searchString).catch((error) =>
    Logger.error("Unhandled error:", error)
);
