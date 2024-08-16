import ogs = require("open-graph-scraper");
import { dataSource } from "src/core/infra/postgres";
import { Content } from "src/core/infra/postgres/entities";
import { isSuccess } from "src/core/logic";
import { Logger } from "src/utils/logger";
import { contentRepo } from "../../modules/content/infra";
import { firebase } from "../../utils/firebase";

const BATCH_SIZE = 10;

const scrapeAndUploadThumbnail = async (content: Content) => {
    try {
        const options = { url: content.websiteUrl };
        const { result } = await ogs(options);

        if (result.ogImage && result.ogImage.length > 0) {
            const imageUrl = result.ogImage[0].url;
            const uploadResult = await firebase.storage.upload(imageUrl);

            if (isSuccess(uploadResult)) {
                content.thumbnailImageUrl = uploadResult.value.originalUrl;
                Logger.info(`Thumbnail uploaded for content: ${content.id}`);
            } else {
                Logger.error(
                    `Failed to upload thumbnail for content: ${content.id}`
                );
            }
        } else {
            Logger.info(`No og:image found for content: ${content.id}`);
        }
    } catch (error) {
        Logger.error(`Error processing content ${content.id}:`, error);
    }

    return content;
};

const processBatch = async (contents: Content[]) => {
    for (const content of contents) {
        await scrapeAndUploadThumbnail(content);
    }

    const saveResponse = await contentRepo.saveMany(contents);
    if (isSuccess(saveResponse)) {
        Logger.info(
            `Successfully updated ${contents.length} contents with thumbnails`
        );
    } else {
        Logger.error("Failed to save updated contents:", saveResponse.error);
    }
};

const addThumbnailsToContent = async () => {
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

        for (let i = 0; i < allContents.length; i += BATCH_SIZE) {
            const batch = allContents.slice(i, i + BATCH_SIZE);
            Logger.info(
                `Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(
                    allContents.length / BATCH_SIZE
                )}`
            );
            await processBatch(batch);
        }

        Logger.info(`Finished processing all ${allContents.length} contents`);
    } catch (error) {
        Logger.error("Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

addThumbnailsToContent().catch(console.error);
