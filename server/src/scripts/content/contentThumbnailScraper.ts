import { dataSource } from "src/core/infra/postgres";
import { Content } from "src/core/infra/postgres/entities";
import { isSuccess } from "src/core/logic";
import { OpenGraphService } from "src/modules/content/services/openGraphService";
import { Logger } from "src/utils/logger";
import { contentRepo } from "../../modules/content/infra";

const BATCH_SIZE = 10;

const scrapeAndUploadThumbnail = async (content: Content) => {
    const openGraphData = await OpenGraphService.fetchOpenGraphData(
        content.websiteUrl
    );

    content.thumbnailImageUrl = openGraphData.thumbnailImageUrl;
    content.ogDescription = openGraphData.ogDescription;
    content.couldntFetchThumbnail = openGraphData.couldntFetchThumbnail;

    return content;
};

const processBatch = async (
    contents: Content[],
    batchNumber: number,
    totalBatches: number
) => {
    const startTime = Date.now();

    for (const content of contents) {
        await scrapeAndUploadThumbnail(content);
    }

    const saveResponse = await contentRepo.saveMany(contents);
    if (isSuccess(saveResponse)) {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // Convert to seconds
        Logger.info(
            `Successfully updated ${contents.length} contents with thumbnails`
        );
        Logger.info(
            `Processed batch ${batchNumber} of ${totalBatches} in ${duration.toFixed(
                2
            )} seconds`
        );
    } else {
        Logger.error("Failed to save updated contents:", saveResponse.error);
    }
};

const addThumbnailsToContent = async () => {
    const overallStartTime = Date.now();
    try {
        await dataSource.initialize();

        const contentsResponse =
            await contentRepo.filterContentWithoutThumbnail();

        if (!isSuccess(contentsResponse)) {
            Logger.error(
                "Failed to fetch contents without thumbnail:",
                contentsResponse.error
            );
            return;
        }

        const allContents = contentsResponse.value;
        Logger.info(`Found ${allContents.length} contents without thumbnails`);

        const totalBatches = Math.ceil(allContents.length / BATCH_SIZE);

        for (let i = 0; i < allContents.length; i += BATCH_SIZE) {
            const batch = allContents.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            await processBatch(batch, batchNumber, totalBatches);
        }

        const overallEndTime = Date.now();
        const overallDuration = (overallEndTime - overallStartTime) / 1000; // Convert to seconds
        Logger.info(
            `Finished processing all ${
                allContents.length
            } contents in ${overallDuration.toFixed(2)} seconds`
        );
    } catch (error) {
        Logger.error("Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

addThumbnailsToContent().catch(console.error);
