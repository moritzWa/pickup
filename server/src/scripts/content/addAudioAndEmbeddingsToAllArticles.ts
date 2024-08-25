import { OpenAI } from "openai";
import { performance } from "perf_hooks";
import * as pgvector from "pgvector/pg";
import { dataSource } from "src/core/infra/postgres";
import { ContentChunk } from "src/core/infra/postgres/entities";
import { contentChunkRepo, contentRepo } from "src/modules/content/infra";
import { chunkText } from "src/modules/content/services/utils";
import { AudioService } from "src/shared/audioService";
import { Logger } from "src/utils/logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const processArticle = async (article) => {
    try {
        // Generate audio

        // log the article url
        Logger.info(`Processing article: ${article.websiteUrl}`);
        const startTime = performance.now();

        // Generate audio
        const audioStartTime = performance.now();
        const audioResult = await AudioService.generate(
            article.content,
            article.title
        );
        const audioEndTime = performance.now();
        Logger.info(
            `Audio generation took ${(audioEndTime - audioStartTime) / 1000}s`
        );

        if (audioResult.isFailure()) {
            throw new Error(`Failed to generate audio: ${audioResult.error}`);
        }

        // Update article with audio URL and length
        article.audioUrl = audioResult.value.url;
        article.lengthMs = audioResult.value.lengthMs;

        // log the audio url
        Logger.info(`Audio URL done: ${article.audioUrl}`);

        // Generate embeddings
        const chunks = chunkText(article.content, 1200);
        const embeddings = await Promise.all(
            chunks.map((chunk) =>
                openai.embeddings.create({
                    model: "text-embedding-3-large",
                    dimensions: 256,
                    input: chunk,
                    encoding_format: "float",
                })
            )
        );

        // Save embeddings as content chunks
        await Promise.all(
            embeddings.map((embedding, index) => {
                const contentChunk = new ContentChunk();
                contentChunk.chunkIndex = index;
                contentChunk.transcript = chunks[index];
                contentChunk.embedding = pgvector.toSql(
                    embedding.data[0].embedding
                );
                contentChunk.contentId = article.id;
                return contentChunkRepo.save(contentChunk);
            })
        );

        // Save updated article
        await contentRepo.save(article);
        const endTime = performance.now();
        Logger.info(
            `Total processing time for article: ${
                (endTime - startTime) / 1000
            }s`
        );
    } catch (error) {
        Logger.error(`Failed to process article ${article.id}:`, error);
    }
};

const addAudioAndEmbeddingsToAllArticles = async () => {
    await dataSource.initialize();

    const initialArticlesResponse =
        await contentRepo.findArticlesWithoutAudioAndEmbeddings();
    const totalArticles = initialArticlesResponse.value.length;
    Logger.info(
        `Total articles without audio and embeddings: ${totalArticles}`
    );

    try {
        const limit = 5; // Adjust as needed
        let articlesResponse;
        let processedCount = 0;

        do {
            articlesResponse =
                await contentRepo.findArticlesWithoutAudioAndEmbeddings(limit);
            if (articlesResponse.isFailure()) {
                Logger.error(
                    "Failed to fetch articles:",
                    articlesResponse.error
                );
                return;
            }

            const articles = articlesResponse.value;

            if (articles.length === 0) {
                Logger.info("No more articles to process. Exiting.");
                break;
            }

            Logger.info(`Processing batch of ${articles.length} articles...`);
            const startTime = performance.now();

            await Promise.all(articles.map(processArticle));
            processedCount += articles.length;

            const batchTime = (performance.now() - startTime) / 1000;
            Logger.info(
                `Processed ${articles.length} articles in ${batchTime.toFixed(
                    2
                )}s.`
            );

            const percentageProcessed = (
                (processedCount / totalArticles) *
                100
            ).toFixed(2);
            Logger.info(
                `Total processed: ${processedCount}/${totalArticles} (${percentageProcessed}%)`
            );
        } while (articlesResponse.value.length > 0);

        Logger.info("Finished processing all articles.");
    } catch (error) {
        Logger.error("Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

addAudioAndEmbeddingsToAllArticles().catch((error) =>
    Logger.error("Unhandled error:", error)
);
