// options:
// - https://www.npmjs.com/package/@postlight/parser // uses private github dependency only accessible via ssh token
// - https://www.npmjs.com/package/@mozilla/readability <- current pick

import { isProbablyReaderable, Readability } from "@mozilla/readability";
import { EventEmitter } from "events";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import * as pdf from "pdf-parse";
import { dataSource } from "src/core/infra/postgres";
import { CuriusLink } from "src/core/infra/postgres/entities";
import { curiusLinkRepo } from "src/modules/curius/infra";
import { Logger } from "src/utils/logger";
import { isSuccess } from "./utils";
EventEmitter.defaultMaxListeners = 100;

const sanitizeText = (text: string) => {
    return text.replace(/\0/g, ""); // Remove null bytes
};

const originalConsoleError = console.error;
console.error = (...args) => {
    const errorMessages = [
        "Could not parse CSS stylesheet",
        "Could not parse CSS @import URL",
        "Could not load link:",
        "Error: Could not load link:",
    ];

    if (args[0] && errorMessages.some((msg) => args[0].includes(msg))) {
        return; // Suppress these specific errors
    }
    originalConsoleError(...args);
};

const BATCH_SIZE = 60; // Increased batch size
const CONCURRENCY_LIMIT = 20; // Number of links to process concurrently

const addFullTextToLinks = async () => {
    try {
        await dataSource.initialize();

        let totalProcessed = 0;

        // log countLinksWithoutFullText
        const countLinksWithoutFullText =
            await curiusLinkRepo.countLinksWithoutFullText();
        Logger.info(
            `Count of links without full text: ${countLinksWithoutFullText.value}`
        );

        while (true) {
            const linksResponse = await curiusLinkRepo.findLinksWithoutFullText(
                BATCH_SIZE
            );
            if (!isSuccess(linksResponse)) {
                Logger.error(
                    "Failed to fetch links without full text:",
                    linksResponse.error
                );
                return;
            }

            const links = linksResponse.value;
            if (links.length === 0) {
                Logger.info("No more links to process. Exiting.");
                break;
            }

            Logger.info(`Processing batch of ${links.length} links...`);
            const startTime = Date.now();

            // Process links concurrently
            const processedLinks = await processLinksConcurrently(links);

            // Batch save to database
            await curiusLinkRepo.saveMany(processedLinks);

            totalProcessed += links.length;
            const batchTime = (Date.now() - startTime) / 1000;
            Logger.info(
                `Processed ${links.length} links in ${batchTime.toFixed(
                    2
                )}s. Total: ${totalProcessed}`
            );
        }

        Logger.info(`Finished processing ${totalProcessed} links in total.`);
    } catch (error) {
        Logger.error("Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

const processLinksConcurrently = async (
    links: CuriusLink[]
): Promise<CuriusLink[]> => {
    const processChunk = async (chunk: CuriusLink[]) => {
        return Promise.all(chunk.map(processLink));
    };

    const chunks: CuriusLink[][] = [];
    for (let i = 0; i < links.length; i += CONCURRENCY_LIMIT) {
        chunks.push(links.slice(i, i + CONCURRENCY_LIMIT));
    }

    const processedChunks = await Promise.all(chunks.map(processChunk));
    return processedChunks.flat();
};

const CONTENT_TYPE_TIMEOUT = 20000; // 20 seconds

const getContentType = async (url: string): Promise<string | null> => {
    try {
        const controller = new AbortController();
        const timeoutId = globalThis.setTimeout(
            () => controller.abort(),
            CONTENT_TYPE_TIMEOUT
        );

        const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
        });

        globalThis.clearTimeout(timeoutId);

        return response.headers.get("content-type");
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            Logger.info(`Timeout fetching content type for ${url}`);
        } else {
            // Logger.error(
            //     `Error fetching content type for ${url}:`,
            //     getErrorMessage(error)
            // );
        }
        return null;
    }
};

const processLink = async (link: CuriusLink): Promise<CuriusLink> => {
    try {
        const isProbablyPDF = /\.pdf($|\?)/i.test(link.link);

        if (isProbablyPDF) {
            await processPDFLink(link);
        } else {
            try {
                await processHTMLLink(link);
            } catch (error) {
                // If HTML processing fails, try processing as PDF
                if (error instanceof Error && error.message.includes("PDF")) {
                    await processPDFLink(link);
                } else {
                    throw error; // Re-throw if it's not a PDF-related error
                }
            }
        }
    } catch (error) {
        link.skippedErrorFetchingFullText = true;
        // Log the error if needed
    }
    return link;
};

type SkipType =
    | "skippedErrorFetchingFullText"
    | "skippedNotProbablyReadable"
    | "skippedInaccessiblePDF"
    | "deadLink";

const markSkip = (link, skipType: SkipType, message?: string) => {
    link[skipType] = true;
    // Logger.info(
    //     `Marking link as skipped: ${link.id} (${link.link}) ${
    //         message ? `(${message})` : ""
    //     }`
    // );
};

const handleNonOkResponse = (link, response) => {
    if (response.status === 404 || response.status === 410) {
        markSkip(link, "deadLink");
    } else {
        markSkip(
            link,
            "skippedErrorFetchingFullText",
            `status: ${response.status}`
        );
    }
};

const handleHTMLLinkProcessingError = (link, error) => {
    if (error instanceof Error) {
        if (error.message === "Fetch timeout") {
            // Logger.info(`Timeout fetching link: ${link.id} (${link.link})`);
        } else {
            // Logger.error(
            //     `Error processing HTML link ${link.id}:`,
            //     getErrorMessage(error)
            // );
        }
    } else {
        Logger.error(
            `Unknown error processing HTML link ${link.id}:`,
            String(error)
        );
    }
    markSkip(link, "skippedErrorFetchingFullText");
};

const updateLinkWithParsedContent = (link, result) => {
    Object.assign(link, {
        length: result.length,
        excerpt: result.excerpt,
        byline: result.byline,
        dir: result.dir,
        siteName: result.siteName,
        lang: result.lang,
        publishedTime: result.publishedTime,
        title: result.title || link.title,
        fullText: NodeHtmlMarkdown.translate(result.content || ""),
    });
};

const FETCH_TIMEOUT = 30000; // 30 seconds
const processHTMLLink = async (link) => {
    try {
        // Logger.info(`Fetching link: ${link.id} (${link.link})`);

        const fetchPromise = fetch(link.link);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Fetch timeout")), FETCH_TIMEOUT)
        );

        const response = (await Promise.race([
            fetchPromise,
            timeoutPromise,
        ])) as Response;

        if (!response.ok) {
            handleNonOkResponse(link, response);
            return;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/pdf")) {
            throw new Error("Unexpected PDF content");
        }

        const html = await response.text();

        const { window } = new JSDOM(html, {
            // Add these options to further reduce CSS-related errors
            runScripts: "outside-only",
            resources: "usable",
            virtualConsole: new JSDOM.VirtualConsole().sendTo(console, {
                omitJSDOMErrors: true,
            }),
            pretendToBeVisual: true,
            url: link.link,
        });
        if (
            !isProbablyReaderable(window.document, {
                minScore: 10,
                minContentLength: 90,
            })
        ) {
            markSkip(link, "skippedNotProbablyReadable");
            return;
        }

        const result = new Readability(window.document).parse();
        if (!result) {
            markSkip(link, "skippedErrorFetchingFullText");
            return;
        }

        updateLinkWithParsedContent(link, result);
        // Logger.info(`Successfully processed link: ${link.id} (${link.link})`);
    } catch (error) {
        handleHTMLLinkProcessingError(link, error);
    }
};

const processPDFLink = async (link) => {
    const response = await fetch(link.link);
    if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/pdf")
    ) {
        // Logger.info(`Skipping inaccessible PDF: ${link.link}`);
        link.skippedInaccessiblePDF = true;
        return;
    }

    const pdfBuffer = await response.arrayBuffer();
    const parsedPDF = await pdf(Buffer.from(pdfBuffer), { max: 20 });
    link.fullText = sanitizeText(parsedPDF.text);
    link.totalPagesIfPDF = parsedPDF.numpages;
    link.fetchedPagesIfPDF = parsedPDF.numrender;
};

addFullTextToLinks().catch(console.error);
