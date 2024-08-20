// options:
// - https://www.npmjs.com/package/@postlight/parser // uses private github dependency only accessible via ssh token
// - https://www.npmjs.com/package/@mozilla/readability <- current pick

import { EventEmitter } from "events";
import { dataSource } from "src/core/infra/postgres";
import { Content } from "src/core/infra/postgres/entities";
import { isSuccess } from "src/core/logic";
import { Logger } from "src/utils/logger";
import { contentRepo } from "../../modules/content/infra";
import { ScrapeContentTextService } from "../../modules/content/services/scrapeContentTextService";
EventEmitter.defaultMaxListeners = 100;

const sanitizeText = (text: string) => {
    return text.replace(/\0/g, ""); // Remove null bytes
};

type ReadabilityResult = {
    title: string;

    /** HTML string of processed article content */
    content: string;

    /** text content of the article, with all the HTML tags removed */
    textContent: string;

    /** length of an article, in characters */
    length: number;

    /** article description, or short excerpt from the content */
    excerpt: string;

    /** author metadata */
    byline: string;

    /** content direction */
    dir: string;

    /** name of the site */
    siteName: string;

    /** content language */
    lang: string;

    /** published time */
    publishedTime: string;
};

const originalConsoleError = console.error;
console.error = (...args) => {
    const errorMessages = [
        "Could not parse CSS stylesheet",
        "Could not parse CSS @import URL",
        "Could not load content:",
        "Error: Could not load content:",
    ];

    if (args[0] && errorMessages.some((msg) => args[0].includes(msg))) {
        return; // Suppress these specific errors
    }
    originalConsoleError(...args);
};

const BATCH_SIZE = 1; // Increased batch size // move back to 60
const CONCURRENCY_LIMIT = 1; // Number of contents to process concurrently // move back to 20
const MAX_CONTENTS_TO_PROCESS = 687;

const addFullTextToContent = async () => {
    try {
        await dataSource.initialize();

        const countContentsWithoutFullText =
            await contentRepo.countContentsWithoutFullText();
        const totalToProcess = Math.min(
            countContentsWithoutFullText.value,
            MAX_CONTENTS_TO_PROCESS
        );

        // New logic to ensure we don't exceed available contents
        const actualTotalToProcess = Math.min(
            totalToProcess,
            countContentsWithoutFullText.value
        );

        Logger.info(
            `Will process up to ${actualTotalToProcess} contents out of ${countContentsWithoutFullText.value} available`
        );

        let totalProcessed = 0;

        while (totalProcessed < actualTotalToProcess) {
            const contentsResponse =
                await contentRepo.filterBestContentWithoutFullText(
                    BATCH_SIZE,
                    totalProcessed
                );

            if (!isSuccess(contentsResponse)) {
                Logger.error(
                    "Failed to fetch contents without content (full text):",
                    contentsResponse.error
                );
                return;
            }

            const contents = contentsResponse.value;

            // const hasContent = contents.find(
            //     (c) => c.id === "81b29e74-e409-44ba-99ec-64d1a7f8a954"
            // );

            // if (hasContent) {
            //     debugger;
            // }

            if (contents.length === 0) {
                Logger.info("No more contents to process. Exiting.");
                break;
            }

            Logger.info(`Processing batch of ${contents.length} contents...`);
            const startTime = Date.now();

            // Process contents concurrently
            const processedContents = await processContentsConcurrently(
                contents
            );

            // debugger;

            // Batch save to database
            const response = await contentRepo.saveMany(processedContents);

            // debugger;

            totalProcessed += contents.length;
            const batchTime = (Date.now() - startTime) / 1000;
            Logger.info(
                `Processed ${contents.length} contents in ${batchTime.toFixed(
                    2
                )}s. Total: ${totalProcessed}`
            );

            if (totalProcessed >= actualTotalToProcess) {
                Logger.info(
                    `Reached the maximum number of contents to process (${actualTotalToProcess}). Exiting.`
                );
                break;
            }
        }

        Logger.info(`Finished processing ${totalProcessed} contents in total.`);
    } catch (error) {
        Logger.error("Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

const processContentsConcurrently = async (
    contents: Content[]
): Promise<Content[]> => {
    const processChunk = async (chunk: Content[]) => {
        return Promise.all(
            chunk.map((content) =>
                // not creating authors assuming that this data already has them
                ScrapeContentTextService.processContent(content, false)
            )
        );
    };

    const chunks: Content[][] = [];
    for (let i = 0; i < contents.length; i += CONCURRENCY_LIMIT) {
        chunks.push(contents.slice(i, i + CONCURRENCY_LIMIT));
    }

    const processedChunks = await Promise.all(chunks.map(processChunk));
    return processedChunks.flat();
};

addFullTextToContent().catch(console.error);
