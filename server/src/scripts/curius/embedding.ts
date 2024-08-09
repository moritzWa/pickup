import { OpenAI } from "openai";
import { performance } from "perf_hooks";
import * as pgvector from "pgvector/pg";
import { dataSource } from "src/core/infra/postgres";
import { CuriusLinkChunk } from "src/core/infra/postgres/entities/Curius/CuriusLinkChunk";
import { curiusLinkChunkRepo, curiusLinkRepo } from "src/modules/curius/infra";
import { Logger } from "src/utils/logger";
import { isSuccess } from "./utils";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const LINKS_TO_PROCESS = 2000;

// TODO: split this usign tiktoken or similar (could also add sliding/overlapping window)
// Improved chunking function
const chunkText = (text: string, chunkSize: number = 1200): string[] => {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];

    for (const word of words) {
        if (currentChunk.join(" ").length + word.length > chunkSize) {
            chunks.push(currentChunk.join(" "));
            currentChunk = [];
        }
        currentChunk.push(word);
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
    }

    return chunks;
};

async function processAndSaveChunks(chunks: string[], link: any) {
    const embeddingStartTime = performance.now();
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
    const embeddingEndTime = performance.now();
    // Logger.info(
    //     `Embedding took ${Math.round(
    //         embeddingEndTime - embeddingStartTime
    //     )}ms for ${chunks.length} chunks.`
    // );

    const savingStartTime = performance.now();
    await Promise.all(
        embeddings.map((embedding, j) => {
            const linkChunk = new CuriusLinkChunk();
            linkChunk.chunkIndex = j;
            linkChunk.text = chunks[j];
            linkChunk.embedding = pgvector.toSql(embedding.data[0].embedding);
            linkChunk.link = Promise.resolve(link);
            return curiusLinkChunkRepo.save(linkChunk);
        })
    );
    const savingEndTime = performance.now();
    // Logger.info(
    //     `Saving took ${Math.round(savingEndTime - savingStartTime)}ms for ${
    //         chunks.length
    //     } chunks.`
    // );
}

async function processLink(link: any, index: number, totalLinks: number) {
    const content = link.fullText || link.title;

    if (!content) {
        Logger.error(`No content available for link ${link.id}. Skipping.`);
        return;
    }

    const linkStartTime = performance.now();
    // Logger.info(`Processing link ${index + 1} of ${totalLinks}: ${link.id}`);

    const chunkingStartTime = performance.now();
    const chunks = chunkText(content);
    const chunkingEndTime = performance.now();
    // Logger.info(
    //     `Chunking took ${Math.round(
    //         chunkingEndTime - chunkingStartTime
    //     )}ms. Created ${chunks.length} chunks.`
    // );

    await processAndSaveChunks(chunks, link);

    const linkEndTime = performance.now();
    // Logger.info(
    //     `Added embeddings for link ${link.id}. Total time: ${Math.round(
    //         linkEndTime - linkStartTime
    //     )}ms`
    // );
}

const addEmbeddingsToLinks = async () => {
    await dataSource.initialize();

    try {
        const startTime = performance.now();
        const linksResponse =
            await curiusLinkRepo.findBestLinksWithFullTextWithoutChunks(
                LINKS_TO_PROCESS
            );
        if (!isSuccess(linksResponse)) {
            Logger.error("Failed to fetch links:", linksResponse.error);
            return;
        }

        const links = linksResponse.value;
        Logger.info(`Found ${links.length} best links without embeddings.`);

        for (let i = 0; i < links.length; i++) {
            try {
                await processLink(links[i], i, links.length);
            } catch (error) {
                Logger.error(
                    `Failed to generate embedding for link ${links[i].id}:`,
                    error
                );
            }

            // Simple progress tracking
            const progress = (((i + 1) / links.length) * 100).toFixed(2);
            Logger.info(`Progress: ${progress}% (${i + 1}/${links.length})`);
        }

        const endTime = performance.now();
        Logger.info(
            `Finished adding embeddings to links. Total time: ${Math.round(
                endTime - startTime
            )}ms`
        );
    } catch (error) {
        Logger.error("Error processing links:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

addEmbeddingsToLinks().catch((error) =>
    Logger.error("Unhandled error:", error)
);
