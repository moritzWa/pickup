import { OpenAI } from "openai";
import { performance } from "perf_hooks";
import { dataSource } from "src/core/infra/postgres";
import { contentRepo } from "src/modules/content/infra";
import { ScrapeContentTextService } from "src/modules/content/services/scrapeContentTextService";
import { AudioService } from "src/shared/audioService";
import { Logger } from "src/utils/logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const processArticle = async (article) => {
    try {
        if (!article.content) {
            Logger.info(`Fetching content for article: ${article.websiteUrl}`);
            await ScrapeContentTextService.processContent(article);

            if (!article.content) {
                Logger.warn(
                    `Failed to fetch content for article: ${article.websiteUrl}`
                );
                // save the skippedErrorFetchingFullText etc
                await contentRepo.save(article);
                return;
            }
        }

        if (!article.audioUrl) {
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
        }

        // Save updated article
        await contentRepo.save(article);
    } catch (error) {
        Logger.error(`Failed to process article ${article.id}:`, error);
        // Ensure we save the article even if there's an error
        await contentRepo.save(article);
    }
};

const addMissingColumnsToArticles = async () => {
    await dataSource.initialize();

    const initialArticlesResponse =
        await contentRepo.findArticlesWithoutAudioOrContent();
    const totalArticles = initialArticlesResponse.value.length;
    Logger.info(
        `Total articles without content or audio (or embeddings): ${totalArticles}`
    );

    try {
        const limit = 3; // Adjust as needed
        let processedCount = 0;

        while (true) {
            const articlesResponse =
                await contentRepo.findArticlesWithoutAudioOrContent(limit);
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
