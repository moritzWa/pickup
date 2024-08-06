import { OpenAI } from "openai";
import * as pgvector from "pgvector/pg";
import { dataSource } from "src/core/infra/postgres";
import { CuriusLinkChunk } from "src/core/infra/postgres/entities/Curius/CuriusLinkChunk";
import { curiusLinkChunkRepo, curiusLinkRepo } from "src/modules/curius/infra";
import { isSuccess } from "./addFullTextColumn";
import { performance } from "perf_hooks";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

const addEmbeddingsToLinks = async () => {
    await dataSource.initialize();

    try {
        const startTime = performance.now();
        const linksResponse = await curiusLinkRepo.find();
        if (!isSuccess(linksResponse)) {
            console.error(
                "embedding.ts: Failed to fetch links:",
                linksResponse.error
            );
            return;
        }

        const links = linksResponse.value;
        console.log(`Found ${links.length} links.`);

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            try {
                const content = link.fullText || link.title;

                // Handle potential fetch errors
                if (!content) {
                    console.error(
                        `No content available for link ${link.id}. Skipping.`
                    );
                    continue; // Skip to the next link
                }

                const linkStartTime = performance.now();
                console.log(
                    `embedding.ts: Processing link ${i + 1} of ${
                        links.length
                    }: ${link.id}`
                );

                const chunkingStartTime = performance.now();
                const chunks = chunkText(content);
                const chunkingEndTime = performance.now();
                console.log(
                    `Chunking took ${
                        chunkingEndTime - chunkingStartTime
                    }ms. Created ${chunks.length} chunks.`
                );

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
                console.log(
                    `Embedding took ${
                        embeddingEndTime - embeddingStartTime
                    }ms for ${chunks.length} chunks.`
                );

                const savingStartTime = performance.now();
                await Promise.all(
                    embeddings.map((embedding, j) => {
                        const linkChunk = new CuriusLinkChunk();
                        linkChunk.chunkIndex = j;
                        linkChunk.text = chunks[j];
                        linkChunk.embedding = pgvector.toSql(
                            embedding.data[0].embedding
                        );
                        linkChunk.link = Promise.resolve(link);
                        return curiusLinkChunkRepo.save(linkChunk);
                    })
                );
                const savingEndTime = performance.now();
                console.log(
                    `Saving took ${savingEndTime - savingStartTime}ms for ${
                        chunks.length
                    } chunks.`
                );

                const linkEndTime = performance.now();
                console.log(
                    `embedding.ts: Added embeddings for link ${
                        link.id
                    }. Total time: ${linkEndTime - linkStartTime}ms`
                );
            } catch (error) {
                console.error(
                    `embedding.ts: Failed to generate embedding for link ${link.id}:`,
                    error
                );
            }

            if ((i + 1) % 10 === 0 || i === links.length - 1) {
                console.log(
                    `embedding.ts: Processed ${i + 1} of ${links.length} links`
                );
            }
        }

        const endTime = performance.now();
        console.log(
            `embedding.ts: Finished adding embeddings to links. Total time: ${
                endTime - startTime
            }ms`
        );
    } catch (error) {
        console.error("embedding.ts: Error processing links:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

addEmbeddingsToLinks().catch(console.error);
