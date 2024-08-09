// options:
// - https://www.npmjs.com/package/@postlight/parser // uses private github dependency only accessible via ssh token
// - https://www.npmjs.com/package/@mozilla/readability <- current pick

import { isProbablyReaderable, Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import * as pdf from "pdf-parse";
import { dataSource } from "src/core/infra/postgres";
import { curiusLinkRepo } from "src/modules/curius/infra";
import { LinkResponse } from "src/modules/curius/infra/linkRepo";
import { Logger } from "src/utils/logger";
import { getErrorMessage, isSuccess } from "./utils";

const sanitizeText = (text: string) => {
    return text.replace(/\0/g, ""); // Remove null bytes
};

const originalConsoleError = console.error;
console.error = (...args) => {
    if (args[0] && args[0].includes("Could not parse CSS stylesheet")) {
        return;
    }
    originalConsoleError(...args);
};

const BATCH_SIZE = 10;

const addFullTextToLinks = async () => {
    try {
        await dataSource.initialize();

        let processedCount = 0;
        let totalProcessed = 0;

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

            const totalLinks = links.length;
            Logger.info(`Processing batch of ${totalLinks} links...`);

            const startTime = Date.now();
            const savePromises: Promise<LinkResponse>[] = [];

            for (const link of links) {
                await processLink(link);
                savePromises.push(curiusLinkRepo.save(link));
                processedCount++;
                totalProcessed++;
            }

            await Promise.all(savePromises);

            const batchTime = (Date.now() - startTime) / 1000;
            Logger.info(
                `Processed ${processedCount} links in ${batchTime.toFixed(2)}s`
            );
            processedCount = 0;
        }

        Logger.info(`Finished processing ${totalProcessed} links in total.`);
    } catch (error) {
        Logger.error("Unexpected error:", getErrorMessage(error));
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

const CONTENT_TYPE_TIMEOUT = 10000; // 10 seconds

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
            Logger.error(
                `Error fetching content type for ${url}:`,
                getErrorMessage(error)
            );
        }
        return null;
    }
};

const processLink = async (link) => {
    try {
        Logger.info(`Starting to process link: ${link.id} (${link.link})`);
        const contentType = await getContentType(link.link);

        if (contentType?.includes("application/pdf")) {
            await processPDFLink(link);
        } else {
            await processHTMLLink(link);
        }
        Logger.info(`Finished processing link: ${link.id} (${link.link})`);
    } catch (error) {
        Logger.error(
            `Error processing link ${link.id}:`,
            error instanceof Error ? error.message : String(error)
        );
        link.skippedErrorFetchingFullText = true;
    }
};

type SkipType =
    | "skippedErrorFetchingFullText"
    | "skippedNotProbablyReadable"
    | "skippedInaccessiblePDF"
    | "deadLink";

const markSkip = (link, skipType: SkipType, message?: string) => {
    link[skipType] = true;
    Logger.info(
        `Marking link as skipped: ${link.id} (${link.link}) ${
            message ? `(${message})` : ""
        }`
    );
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

const FETCH_TIMEOUT = 30000; // 30 seconds
const processHTMLLink = async (link) => {
    // mark this link as skippedErrorFetchingFullText: https://theanarchistlibrary.org/library/the-anarchist-faq-editorial-collective-an-anarchist-faq-full or https://www.sparknotes.com/lit/pride/section4/
    if (link.link.includes("theanarchistlibrary.org")) {
        markSkip(link, "skippedErrorFetchingFullText");
        return;
    }

    try {
        Logger.info(`Fetching link: ${link.id} (${link.link})`);

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

        const html = await response.text();

        const { window } = new JSDOM(html);
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

        // Assign properties if parsing is successful
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
        Logger.info(`Successfully processed link: ${link.id} (${link.link})`);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Fetch timeout") {
                Logger.info(`Timeout fetching link: ${link.id} (${link.link})`);
            } else {
                Logger.error(
                    `Error processing HTML link ${link.id}:`,
                    getErrorMessage(error)
                );
            }
        } else {
            Logger.error(
                `Unknown error processing HTML link ${link.id}:`,
                String(error)
            );
        }
        link.skippedErrorFetchingFullText = true;
    }
};

const processPDFLink = async (link) => {
    const response = await fetch(link.link);
    if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/pdf")
    ) {
        Logger.info(`Skipping inaccessible PDF: ${link.link}`);
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
