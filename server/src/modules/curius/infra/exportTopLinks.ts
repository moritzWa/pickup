import * as fs from "fs";
import { dataSource } from "src/core/infra/postgres";
import { curiusLinkRepo } from "src/modules/curius/infra";
import { isSuccess } from "src/scripts/curius/utils";
import { Logger } from "src/utils/logger";

const LINKS_TO_EXPORT = 4000;

const exportTopLinks = async () => {
    await dataSource.initialize();

    try {
        const linksResponse =
            await curiusLinkRepo.filterBestLinksWithFullTextAndChunks(
                LINKS_TO_EXPORT
            );

        if (!isSuccess(linksResponse)) {
            Logger.error("Failed to fetch top links:", linksResponse.error);
            return;
        }

        const links = linksResponse.value;
        Logger.info(
            `Found ${links.length} top links with full text and chunks.`
        );

        const exportData = await Promise.all(
            links.map(async (link) => ({
                id: link.id,
                link: link.link,
                title: link.title,
                fullText: link.fullText,
                readCount: link.readCount,
                userIds: link.userIds,
                publishedTime: link.publishedTime,
                chunks: (
                    await link.chunks
                ).map((chunk) => ({
                    chunkIndex: chunk.chunkIndex,
                    text: chunk.text,
                    embedding: chunk.embedding,
                })),
            }))
        );

        fs.writeFileSync("topLinks.json", JSON.stringify(exportData, null, 2));
        Logger.info(`Exported ${links.length} links to topLinks.json`);
    } catch (error) {
        Logger.error("Error exporting top links:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

exportTopLinks().catch(console.error);
