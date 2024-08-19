import ogs = require("open-graph-scraper");
import { isSuccess } from "src/core/logic";
import { firebase, Logger } from "src/utils";

export interface OpenGraphResult {
    thumbnailImageUrl: string | null;
    ogDescription: string | null;
    couldntFetchThumbnail: boolean;
}

const truncateString = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
};

export const OpenGraphService = {
    fetchOpenGraphData: async (url: string): Promise<OpenGraphResult> => {
        try {
            let options = { url };

            url = url.trim();

            // use root if url is pdf
            if (url.endsWith(".pdf")) {
                options = { url: getRootOfURL(url) };
            }

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
                Logger.info(
                    `No og:image found for content: ${url}, falling back to favicon`
                );
                imageUrl = getFaviconURL(url);
            }

            // log entire json output of ogs result
            console.log(
                `OGS result for content ${url}:`,
                truncateString(JSON.stringify(result), 500)
            );

            // log imageUrl for link
            Logger.info(`Image URL for content ${url}: ${imageUrl}`);

            // Upload image to Firebase Storage
            let uploadResult = await firebase.storage.upload(imageUrl);

            if (
                !isSuccess(uploadResult) &&
                imageUrl &&
                !imageUrl.includes("www.")
            ) {
                const urlWithWww = new URL(imageUrl);
                urlWithWww.hostname = `www.${urlWithWww.hostname}`;
                imageUrl = urlWithWww.toString();
                uploadResult = await firebase.storage.upload(imageUrl);
            }

            if (!isSuccess(uploadResult)) {
                Logger.error(
                    `Failed to upload thumbnail for content: ${url}, retrying with favicon`
                );
                imageUrl = getFaviconURL(url);
                uploadResult = await firebase.storage.upload(imageUrl);

                if (!isSuccess(uploadResult)) {
                    Logger.error(
                        `Failed to upload favicon for content: ${url}`
                    );
                    return {
                        thumbnailImageUrl: null,
                        ogDescription: result.ogDescription ?? null,
                        couldntFetchThumbnail: true,
                    };
                }
            }

            return {
                thumbnailImageUrl: uploadResult.value.originalUrl,
                ogDescription: result.ogDescription ?? null,
                couldntFetchThumbnail: false,
            };
        } catch (error) {
            Logger.error(
                `Error processing content ${url}: ${truncateString(
                    JSON.stringify(error),
                    200
                )}`
            );
            return {
                thumbnailImageUrl: null,
                ogDescription: null,
                couldntFetchThumbnail: true,
            };
        }
    },
};

function getFaviconURL(url: string): string {
    const root = getRootOfURL(url);
    return getFaviconUrlFromDuckDuckGo(root);
}

function getRootOfURL(url: string): string {
    try {
        const parsedUrl = new URL(url);

        // If the URL ends with .pdf, return the origin (root URL)
        return parsedUrl.pathname.endsWith(".pdf")
            ? parsedUrl.origin
            : parsedUrl.hostname;
    } catch (e) {
        Logger.error(`Error getting root of URL ${url}: ${e}`);
        return "";
    }
}

function getFaviconUrlFromDuckDuckGo(baseDomain: string): string {
    return `https://icons.duckduckgo.com/ip3/${baseDomain}.ico`;
}
