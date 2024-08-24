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

        const audioResult = await AudioService.generate(
            article.content,
            article.title
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
    } catch (error) {
        Logger.error(`Failed to process article ${article.id}:`, error);
    }
};

const addAudioAndEmbeddingsToAllArticles = async () => {
    await dataSource.initialize();

    // ok briefly at the start of this log how much the total result of findArticlesWithoutAudioAndEmbeddings is
    const articlesResponse =
        await contentRepo.findArticlesWithoutAudioAndEmbeddings();
    Logger.info(
        `Total articles without audio and embeddings: ${articlesResponse.value.length}`
    );

    try {
        const limit = 10; // Adjust as needed
        let articlesResponse;

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

            // await Promise.all(articles.map(processArticle));
            // changes to be sequential bc audio service doesn't support concurrency yet I think
            for (const article of articles) {
                await processArticle(article);
            }

            const batchTime = (performance.now() - startTime) / 1000;
            Logger.info(
                `Processed ${articles.length} articles in ${batchTime.toFixed(
                    2
                )}s.`
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
