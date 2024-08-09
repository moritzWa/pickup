import * as fs from "fs";
import { dataSource } from "src/core/infra/postgres";
import { CuriusLink, CuriusLinkChunk } from "src/core/infra/postgres/entities";
import { Logger } from "src/utils/logger";
import * as path from "path";

const seedTopLinks = async () => {
    await dataSource.initialize();

    try {
        const importPath = path.join(__dirname, "topLinks.json");
        const rawData = fs.readFileSync(importPath, "utf8");
        const topLinks = JSON.parse(rawData);

        const linkRepo = dataSource.getRepository(CuriusLink);
        const chunkRepo = dataSource.getRepository(CuriusLinkChunk);

        for (const linkData of topLinks) {
            const link = new CuriusLink();
            const { chunks, ...linkProperties } = linkData;
            Object.assign(link, linkProperties);

            const savedLink = await linkRepo.save(link);

            for (const chunkData of chunks) {
                const chunk = new CuriusLinkChunk();
                Object.assign(chunk, chunkData);
                chunk.link = Promise.resolve(savedLink);
                await chunkRepo.save(chunk);
            }

            Logger.info(
                `Seeded link ${savedLink.id} with ${chunks.length} chunks`
            );
        }

        Logger.info(`Finished seeding ${topLinks.length} links`);
    } catch (error) {
        Logger.error("Error seeding top links:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }

    debugger;
};

seedTopLinks().catch(console.error);
