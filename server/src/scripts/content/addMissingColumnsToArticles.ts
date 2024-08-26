import { OpenAI } from "openai";
import { performance } from "perf_hooks";
import * as pgvector from "pgvector/pg";
import { dataSource } from "src/core/infra/postgres";
import { ContentChunk } from "src/core/infra/postgres/entities";
import { contentChunkRepo, contentRepo } from "src/modules/content/infra";
import { ScrapeContentTextService } from "src/modules/content/services/scrapeContentTextService";
import { chunkText } from "src/modules/content/services/utils";
import { AudioService } from "src/shared/audioService";
import { Logger } from "src/utils/logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const processArticle = async (article) => {
    try {
        if (article.content && article.audioUrl && article.chunks.length > 0) {
            Logger.info(
                `Article ${article.id} is already fully processed. Skipping.`
            );
            return;
        }

        if (!article.content) {
            Logger.info(`Fetching content for article: ${article.websiteUrl}`);
            await ScrapeContentTextService.processContent(article);

            // if (!article.content) {
            //     Logger.warn(
            //         `Failed to fetch content for article: ${article.websiteUrl}`
            //     );
            //     // save the skippedErrorFetchingFullText etc
            //     await contentRepo.save(article);
            //     return;
            // }

            await contentRepo.save(article);
        }

        const successfullyScrapedContent =
            article.content &&
            !article.skippedErrorFetchingFullText &&
            !article.skippedNotProbablyReadable &&
            !article.skippedInaccessiblePDF &&
            !article.deadLink;

        if (successfullyScrapedContent && article.chunks.length === 0) {
            Logger.info(
                `Generating embeddings for article: ${article.websiteUrl}`
            );
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
            article.chunks = await Promise.all(
                embeddings.map((embedding, index) => {
                    const contentChunk = new ContentChunk();
                    contentChunk.chunkIndex = index;
                    contentChunk.transcript = chunks[index];
                    contentChunk.embedding = pgvector.toSql(
                        embedding.data[0].embedding
                    );
                    contentChunk.content = article;
                    return contentChunkRepo.save(contentChunk);
                })
            );

            await contentRepo.save(article);
        }

        if (successfullyScrapedContent && !article.audioUrl) {
            Logger.info(`Generating audio for article: ${article.websiteUrl}`);
            const audioStartTime = performance.now();
            const audioResult = await AudioService.generate(
                article.content,
                article.title
            );
            const audioEndTime = performance.now();
            Logger.info(
                `Audio generation took ${
                    (audioEndTime - audioStartTime) / 1000
                }s`
            );

            if (audioResult.isFailure()) {
                throw new Error(
                    `Failed to generate audio: ${audioResult.error}`
                );
            }

            // Update article with audio URL and length
            article.audioUrl = audioResult.value.url;
            article.lengthMs = audioResult.value.lengthMs;

            Logger.info(`Audio URL done: ${article.audioUrl}`);

            await contentRepo.save(article);
            Logger.info(`Saved article: ${article.title}`);
        }

        // Save updated article
        // await contentRepo.save(article);
    } catch (error) {
        Logger.error(`Failed to process article ${article.title}:`, error);
        // Ensure we save the article even if there's an error
        await contentRepo.save(article);
    }
};

const addMissingColumnsToArticles = async () => {
    await dataSource.initialize();

    const initialArticlesResponse =
        await contentRepo.findArticlesWithoutAudioOrContentOrEmbedding();

    if (initialArticlesResponse.isFailure()) {
        Logger.error(
            "Failed to fetch initial articles:",
            initialArticlesResponse.error
        );
        return;
    }

    const articles = initialArticlesResponse.value;
    const totalArticles = articles.length;

    const missingContent = articles.filter((a) => !a.content).length;
    const missingAudio = articles.filter((a) => !a.audioUrl).length;
    const missingEmbeddings = articles.filter(
        (a) => a.chunks.length === 0
    ).length;

    Logger.info(`
Total articles to process: ${totalArticles}
Breakdown:
- Missing content: ${missingContent}
- Missing audio: ${missingAudio}
- Missing embeddings: ${missingEmbeddings}
    `);

    try {
        const limit = 1; // Adjust as needed
        let processedCount = 0;

        while (true) {
            const articlesResponse =
                await contentRepo.findArticlesWithoutAudioOrContentOrEmbedding(
                    limit
                );
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

            Logger.info(`Total processed: ${processedCount}`);
        }

        Logger.info("Finished processing all articles.");
    } catch (error) {
        Logger.error("Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

addMissingColumnsToArticles().catch((error) =>
    Logger.error("Unhandled error:", error)
);
