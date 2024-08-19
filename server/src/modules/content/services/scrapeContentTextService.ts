import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import * as pdf from "pdf-parse";
import { Content } from "src/core/infra/postgres/entities";
import { Logger } from "src/utils/logger";

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

const sanitizeText = (text: string) => {
    return text.replace(/\0/g, ""); // Remove null bytes
};

const FETCH_TIMEOUT = 120000; // Increase to 2m

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
    }
    return content;
};

const processHTMLContent = async (content: Content) => {
    try {
        Logger.info(
            `Fetching content: ${content.websiteUrl} i.e. ${content.title}`
        );

        const fetchPromise = fetch(content.websiteUrl);

        let timetoutId: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>(
            (_, reject) =>
                (timetoutId = setTimeout(() => {
                    Logger.info(
                        `Fetch timeout for content: ${content.websiteUrl} i.e. ${content.title}`
                    );
                    reject(new Error("Fetch timeout"));
                }, FETCH_TIMEOUT))
        );

        const response = (await Promise.race([
            fetchPromise,
            timeoutPromise,
        ])) as Response;

        if (timetoutId) {
            clearTimeout(timetoutId);
        }

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

        const result = new Readability(window.document).parse();
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
        content.skippedInaccessiblePDF = true;
        return;
    }

    const pdfBuffer = await response.arrayBuffer();
    const parsedPDF = await pdf(Buffer.from(pdfBuffer), { max: 20 });
    content.content = sanitizeText(parsedPDF.text);
    content.totalPagesIfPDF = parsedPDF.numpages;
    content.fetchedPagesIfPDF = parsedPDF.numrender;
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
        contentAsMarkdown: NodeHtmlMarkdown.translate(result.content || ""),
    });
};

export const ScrapeContentTextService = {
    processContent,
};
