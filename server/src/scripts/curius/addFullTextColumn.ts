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

const BATCH_SIZE = 50; // Reduced batch size

// Save the original console.error method
const originalConsoleError = console.error;

// Override console.error to filter out specific error messages
console.error = (...args) => {
    if (args[0] && args[0].includes("Could not parse CSS stylesheet")) {
        return;
    }
    originalConsoleError(...args);
};

const SLOW_LINK_THRESHOLD_MS = 10000; // 10 seconds

const addFullTextToLinks = async () => {
    try {
        await dataSource.initialize();

        const totalLinksResponse =
            await curiusLinkRepo.countLinksWithoutFullText();

        const totalLinks = totalLinksResponse.value;
        let processedLinks = 0;
        let hasMoreLinks = true;

        Logger.info(`Total links to process: ${totalLinks}`);

        // Estimate total processing time
        const avgTimePerLink = 10; // Assume 10 seconds per link initially
        const estimatedTime = ((totalLinks * avgTimePerLink) / 60).toFixed(2);
        Logger.info(
            `Estimated total processing time: ~${estimatedTime} minutes i.e. ~${(
                Number(estimatedTime) / 60
            ).toFixed(2)} hours`
        );

        while (hasMoreLinks) {
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
            const batchSize = links.length;

            if (batchSize === 0) {
                hasMoreLinks = false;
                break;
            }

            Logger.info(`Processing batch of ${batchSize} links...`);

            const startTime = Date.now();
            const savePromises: Promise<LinkResponse>[] = [];

            const processLink = async (link) => {
                const linkStartTime = Date.now();
                try {
                    if (link.link.endsWith(".pdf")) {
                        await processPDFLink(link);
                    } else {
                        await processHTMLLink(link);
                    }
                } catch (error) {
                    link.skippedErrorFetchingFullText = true;
                } finally {
                    const linkEndTime = Date.now();
                    const linkProcessingTime = linkEndTime - linkStartTime;
                    if (linkProcessingTime > SLOW_LINK_THRESHOLD_MS) {
                        Logger.warn(
                            `Link ${link.link} took ${linkProcessingTime}ms to process`
                        );
                    }

                    if (link.fullText) {
                        link.skippedErrorFetchingFullText = false;
                        link.skippedNotProbablyReadable = false;
                        link.skippedInaccessiblePDF = false;
                        link.deadLink = false;
                    }

                    savePromises.push(curiusLinkRepo.save(link));
                }
            };

            await Promise.all(links.map(processLink));
            await Promise.all(savePromises);

            processedLinks += batchSize;
            const progressPercentage = (
                (processedLinks / totalLinks) *
                100
            ).toFixed(2);

            const totalTime = (Date.now() - startTime) / 1000;
            Logger.info(
                `Finished processing ${batchSize} links in ${totalTime.toFixed(
                    2
                )}s. Progress: ${progressPercentage}%`
            );
        }
    } catch (error) {
        Logger.error("Unexpected error:", getErrorMessage(error));
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

const processPDFLink = async (link) => {
    try {
        const response = await fetch(link.link);
        if (
            !response.ok ||
            !response.headers.get("content-type")?.includes("application/pdf")
        ) {
            link.skippedInaccessiblePDF = true;
            return;
        }

        const pdfBuffer = await response.arrayBuffer();
        const parsedPDF = await pdf(Buffer.from(pdfBuffer), { max: 20 });
        link.fullText = sanitizeText(parsedPDF.text);
        link.totalPagesIfPDF = parsedPDF.numpages;
        link.fetchedPagesIfPDF = parsedPDF.numrender;
    } catch (error) {
        link.skippedErrorFetchingFullText = true;
    }
};

const processHTMLLink = async (link) => {
    try {
        const response = await fetch(link.link);

        if (!response.ok) {
            if (response.status === 404 || response.status === 410) {
                link.deadLink = true;
            } else {
                link.skippedErrorFetchingFullText = true;
            }
            return;
        }

        const html = await response.text();

        const { window } = new JSDOM(html);
        if (
            !isProbablyReaderable(window.document, {
                minScore: 5, // Decrease from default 20
                minContentLength: 30, // Decrease from default 140
            })
        ) {
            link.skippedNotProbablyReadable = true;
            return;
        }

        const result = new Readability(window.document).parse();
        if (!result) {
            link.skippedErrorFetchingFullText = true;
            return;
        }

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
    } catch (error) {
        link.skippedErrorFetchingFullText = true;
    }
};

addFullTextToLinks().catch(console.error);
