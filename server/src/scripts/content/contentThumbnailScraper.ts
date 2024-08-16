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

const truncateString = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
};

function getRootOfURL(url: string): string {
    try {
        const parsedUrl = new URL(url);
        // If the URL ends with .pdf, return the origin (root URL)
        if (parsedUrl.pathname.endsWith(".pdf")) {
            return parsedUrl.origin;
        }
        return parsedUrl.hostname;
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

        if (imageUrl && !imageUrl.startsWith("http") && result.requestUrl) {
            const baseUrl = new URL(result.requestUrl);
            imageUrl = new URL(imageUrl, baseUrl).toString();
        }

        if (!imageUrl) {
            // Logger.info(
            //     `No og:image found for content: ${content.websiteUrl}, falling back to favicon`
            // );
            imageUrl = getFaviconURL(content.websiteUrl);
        }

        // log entire json output of ogs result
        console.log(
            `OGS result for content ${content.websiteUrl}:`,
            truncateString(JSON.stringify(result), 500)
        );

        // log imageUrl for link
        Logger.info(`Image URL for content ${content.websiteUrl}: ${imageUrl}`);
        let uploadResult = await firebase.storage.upload(imageUrl);

        if (
            !isSuccess(uploadResult) &&
            imageUrl &&
            !imageUrl.includes("www.")
        ) {
            Logger.info(
                `Retrying upload with www for content: ${content.websiteUrl}`
            );
            const urlWithWww = new URL(imageUrl);
            urlWithWww.hostname = `www.${urlWithWww.hostname}`;
            imageUrl = urlWithWww.toString();
            uploadResult = await firebase.storage.upload(imageUrl);
        }

        if (!isSuccess(uploadResult)) {
            Logger.error(
                `Failed to upload thumbnail for content: ${content.websiteUrl}, retrying with favicon`
            );
            imageUrl = getFaviconURL(content.websiteUrl);
            uploadResult = await firebase.storage.upload(imageUrl);

            if (!isSuccess(uploadResult)) {
                Logger.error(
                    `Failed to upload favicon for content: ${content.websiteUrl}`
                );
                content.couldntFetchThumbnail = true;
                return content;
            }
        }

        if (isSuccess(uploadResult)) {
            content.thumbnailImageUrl = uploadResult.value.originalUrl;
            content.ogDescription = result.ogDescription ?? null;
            content.couldntFetchThumbnail = false;
            // Logger.info(
            //     `Thumbnail uploaded for content: ${content.websiteUrl}`
            // );
        }
    } catch (error) {
        Logger.error(
            `Error processing content ${content.websiteUrl}: ${truncateString(
                JSON.stringify(error),
                200
            )}`
        );
        content.couldntFetchThumbnail = true;
    }

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
