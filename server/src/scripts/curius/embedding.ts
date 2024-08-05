import { OpenAI } from "openai";
import * as pgvector from "pgvector/pg";
import { dataSource } from "src/core/infra/postgres";
import { CuriusLinkChunk } from "src/core/infra/postgres/entities/Curius/CuriusLinkChunk";
import { curiusLinkChunkRepo, curiusLinkRepo } from "src/modules/curius/infra";
import { isSuccess } from "./addFullTextColumn";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const chunkText = (text: string, chunkSize: number = 300): string[] => {
    const sentences = text.split(". ");
    const chunks: string[] = []; // Explicitly define the type of the array
    let currentChunk = "";

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += sentence + ". ";
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};

const addEmbeddingsToLinks = async () => {
    await dataSource.initialize();

    try {
        const linksResponse = await curiusLinkRepo.find();
        if (!isSuccess(linksResponse)) {
            console.error("Failed to fetch links:", linksResponse.error);
            await dataSource.destroy();
            return;
        }

        const links = linksResponse.value;
        console.log(`Found ${links.length} links.`);

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            console.log(
                `Processing link ${i + 1} of ${links.length}: ${link.id}`
            );

            try {
                const content = link.fullText || link.title;
                const chunks = chunkText(content);

                for (let j = 0; j < chunks.length; j++) {
                    const chunk = chunks[j];
                    const embedding = await openai.embeddings.create({
                        model: "text-embedding-3-large",
                        dimensions: 256,
                        input: chunk,
                        encoding_format: "float",
                    });

                    const vector = embedding.data[0].embedding;
                    const linkChunk = new CuriusLinkChunk();
                    linkChunk.chunkIndex = j;
                    linkChunk.text = chunk;
                    linkChunk.embedding = pgvector.toSql(vector);
                    linkChunk.link = Promise.resolve(link);

                    await curiusLinkChunkRepo.save(linkChunk);
                }

                console.log(`Added embeddings for link ${link.id}`);
            } catch (error) {
                console.error(
                    `Failed to generate embedding for link ${link.id}:`,
                    error
                );
            }

            // Log progress every 10 links
            if ((i + 1) % 10 === 0 || i === links.length - 1) {
                console.log(`Processed ${i + 1} of ${links.length} links`);
            }
        }

        console.log("Finished adding embeddings to links");
    } catch (error) {
        console.error("Error processing links:", error);
    } finally {
        await dataSource.destroy();
    }
};

addEmbeddingsToLinks().catch(console.error);
