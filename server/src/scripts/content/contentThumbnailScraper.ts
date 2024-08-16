import ogs = require("open-graph-scraper");
import { dataSource } from "src/core/infra/postgres";
import { Content } from "src/core/infra/postgres/entities";
import { isSuccess } from "src/core/logic";
import { Logger } from "src/utils/logger";
import { contentRepo } from "../../modules/content/infra";
import { firebase } from "../../utils/firebase";

const BATCH_SIZE = 10;

export function getFaviconURL(url: string): string {
    const root = getRootOfURL(url);
    return getFaviconUrlFromDuckDuckGo(root);
}

function getRootOfURL(url: string): string {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return "";
    }
}

function getFaviconUrlFromDuckDuckGo(baseDomain: string): string {
    return `https://icons.duckduckgo.com/ip3/${baseDomain}.ico`;
}

const scrapeAndUploadThumbnail = async (content: Content) => {
    try {
        const options = { url: content.websiteUrl };
        const { result } = await ogs(options);

        let imageUrl =
            result.ogImage && result.ogImage.length > 0
                ? result.ogImage[0].url
                : null;

        if (!imageUrl) {
            Logger.info(
                `No og:image found for content: ${content.websiteUrl}, falling back to favicon`
            );
            imageUrl = getFaviconURL(content.websiteUrl);
        }

        // log entire json output of ogs result
        console.log(
            `OGS result for content ${content.websiteUrl}:`,
            JSON.stringify(result, null, 2)
        );

        // log imageUrl for link
        Logger.info(`Image URL for content ${content.websiteUrl}: ${imageUrl}`);
        let uploadResult = await firebase.storage.upload(imageUrl);

        if (!isSuccess(uploadResult)) {
            Logger.error(
                `Failed to upload thumbnail for content: ${content.websiteUrl}, retrying with favicon`
            );
            imageUrl = getFaviconURL(content.websiteUrl);
            uploadResult = await firebase.storage.upload(imageUrl);
        }

        if (isSuccess(uploadResult)) {
            content.thumbnailImageUrl = uploadResult.value.originalUrl;
            content.ogDescription = result.ogDescription ?? null;
            Logger.info(
                `Thumbnail uploaded for content: ${content.websiteUrl}`
            );
        } else {
            Logger.error(
                `Failed to upload thumbnail for content: ${content.websiteUrl}`
            );
        }
    } catch (error) {
        Logger.error(
            `Error processing content ${content.websiteUrl}: ${JSON.stringify(
                error,
                null,
                2
            )}`
        );
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
