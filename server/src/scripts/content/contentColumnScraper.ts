// options:
// - https://www.npmjs.com/package/@postlight/parser // uses private github dependency only accessible via ssh token
// - https://www.npmjs.com/package/@mozilla/readability <- current pick

import { Readability } from "@mozilla/readability";
import { EventEmitter } from "events";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import * as pdf from "pdf-parse";
import { dataSource } from "src/core/infra/postgres";
import { Content } from "src/core/infra/postgres/entities";
import { isSuccess } from "src/core/logic";
import { Logger } from "src/utils/logger";
import { contentRepo } from "../../modules/content/infra";
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

const BATCH_SIZE = 20; // Increased batch size // move back to 60
const CONCURRENCY_LIMIT = 10; // Number of contents to process concurrently // move back to 20
const MAX_CONTENTS_TO_PROCESS = 687;

const addFullTextToContent = async () => {
    try {
        await dataSource.initialize();

        let totalProcessed = 0;

        // log countContentsWithoutFullText
        const countContentsWithoutFullText =
            await contentRepo.countContentsWithoutFullText();
        Logger.info(
            `Count of contents without full text: ${countContentsWithoutFullText.value}`
        );

        while (totalProcessed < MAX_CONTENTS_TO_PROCESS) {
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

            if (totalProcessed >= MAX_CONTENTS_TO_PROCESS) {
                Logger.info(
                    `Reached the maximum number of contents to process (${MAX_CONTENTS_TO_PROCESS}). Exiting.`
                );
                break;
            }
        }

        Logger.info(`Finished processing ${totalProcessed} contents in total.`);

        debugger;
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
        return Promise.all(chunk.map(processContent));
    };

    const chunks: Content[][] = [];
    for (let i = 0; i < contents.length; i += CONCURRENCY_LIMIT) {
        chunks.push(contents.slice(i, i + CONCURRENCY_LIMIT));
    }

    const processedChunks = await Promise.all(chunks.map(processChunk));
    return processedChunks.flat();
};

const processContent = async (content: Content): Promise<Content> => {
    try {
        const isProbablyPDF = /\.pdf($|\?)/i.test(content.websiteUrl);

        if (isProbablyPDF) {
            await processPDFContent(content);
        } else {
            try {
                await processHTMLContent(content);
            } catch (error) {
                // If HTML processing fails, try processing as PDF
                if (error instanceof Error && error.message.includes("PDF")) {
                    await processPDFContent(content);
                } else {
                    throw error; // Re-throw if it's not a PDF-related error
                }
            }
        }
    } catch (error) {
        content.skippedErrorFetchingFullText = true;
        // Log the error if needed
    }
    return content;
};

type SkipType =
    | "skippedErrorFetchingFullText"
    | "skippedNotProbablyReadable"
    | "skippedInaccessiblePDF"
    | "deadLink";

const markSkip = (content, skipType: SkipType, message?: string) => {
    content[skipType] = true;
    Logger.info(
        `Marking content as skipped: (${content.title} bc of ${skipType}) ${
            message ? `(${message})` : ""
        }`
    );
};

const handleNonOkResponse = (content, response) => {
    if (response.status === 404 || response.status === 410) {
        markSkip(content, "deadLink");
    } else {
        markSkip(
            content,
            "skippedErrorFetchingFullText",
            `status: ${response.status}`
        );
    }
};

const handleHTMLContentProcessingError = (content: Content, error: Error) => {
    if (error instanceof Error) {
        if (error.message === "Fetch timeout") {
            Logger.info(
                `Timeout fetching content: ${content.id} (${content.title})`
            );
        } else {
            Logger.error(
                `Error processing HTML content ${content.id}:`,
                error.message
            );
        }
    } else {
        Logger.error(
            `Unknown error processing HTML content ${content.id}:`,
            String(error)
        );
    }
    markSkip(content, "skippedErrorFetchingFullText");
};

const updateContentWithParsedContent = (content: Content, result) => {
    if (result.content) {
        content.skippedErrorFetchingFullText = false;
        content.skippedNotProbablyReadable = false;
        content.skippedInaccessiblePDF = false;
        content.deadLink = false;
    }

    Object.assign(content, {
        length: result.length,
        excerpt: result.excerpt,
        author: result.byline,
        lang: result.lang,
        releasedAt: result.publishedTime,
        title: result.title || content.title,
        content: result.textContent,
        // we might need this later to give the TTS info about what to emphasize etc
        contentAsMarkdown: NodeHtmlMarkdown.translate(result.content || ""),
    });
};

const FETCH_TIMEOUT = 120000; // Increase to 2m
const processHTMLContent = async (content: Content) => {
    try {
        Logger.info(
            `Fetching content: ${content.websiteUrl} i.e. ${content.title}`
        );

        const fetchPromise = fetch(content.websiteUrl);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => {
                Logger.info(
                    `Fetch timeout for content: ${content.websiteUrl} i.e. ${content.title}`
                );
                reject(new Error("Fetch timeout"));
            }, FETCH_TIMEOUT)
        );

        const response = (await Promise.race([
            fetchPromise,
            timeoutPromise,
        ])) as Response;

        if (!response.ok) {
            handleNonOkResponse(content, response);
            return;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/pdf")) {
            throw new Error("Unexpected PDF content");
        }

        const html = await response.text();

        const { window } = new JSDOM(html);

        const result: ReadabilityResult | null = new Readability(
            window.document
        ).parse();
        if (!result || !result.content) {
            Logger.info(
                `Readability parsing failed for ${content.id} (${content.title})`
            );
            markSkip(content, "skippedErrorFetchingFullText");
            return;
        }

        updateContentWithParsedContent(content, result);
        content.skippedErrorFetchingFullText = false; // Explicitly set to false after successful parsing
        Logger.info(
            `Successfully processed content: ${content.id} (${content.title})`
        );
    } catch (error) {
        Logger.error(
            `Error processing HTML content for ${content.websiteUrl} (${content.title})`,
            error
        );
        handleHTMLContentProcessingError(content, error as Error);
    }
};

const processPDFContent = async (content: Content) => {
    const response = await fetch(content.websiteUrl);
    if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/pdf")
    ) {
        // Logger.info(`Skipping inaccessible PDF: ${content.websiteUrl}`);
        content.skippedInaccessiblePDF = true;
        return;
    }

    const pdfBuffer = await response.arrayBuffer();
    const parsedPDF = await pdf(Buffer.from(pdfBuffer), { max: 20 });
    content.content = sanitizeText(parsedPDF.text);
    content.totalPagesIfPDF = parsedPDF.numpages;
    content.fetchedPagesIfPDF = parsedPDF.numrender;
};

addFullTextToContent().catch(console.error);
