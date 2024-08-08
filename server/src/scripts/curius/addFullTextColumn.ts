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

const addFullTextToLinks = async () => {
    try {
        await dataSource.initialize();

        const linksResponse = await curiusLinkRepo.findFirst100Links();
        // const mockFindLinks = (): Promise<
        //     FailureOrSuccess<DefaultErrors, CuriusLink[]>
        // > => {
        //     const mockLinks = [
        //         {
        //             id: 1,
        //             link: "https://mindbook.dev/shelf",
        //         },
        //         {
        //             id: 2,
        //             link: "xkcd.com",
        //         },
        //         {
        //             id: 3,
        //             link: "https://blog.samaltman.com/funding-for-covid-19-projects",
        //         },
        //         {
        //             id: 4,
        //             link: "https://en.wikipedia.org/wiki/Berlin_Wall",
        //         },
        //     ] as CuriusLink[];
        //     return Promise.resolve(success(mockLinks));
        // };
        // const linksResponse = await mockFindLinks();

        if (!isSuccess(linksResponse)) {
            Logger.error(
                "Failed to fetch links without full text:",
                linksResponse.error
            );
            return;
        }

        const links = linksResponse.value;
        const totalLinks = links.length;
        Logger.info(
            `Starting to process ${totalLinks} links without full text...`
        );

        const startTime = Date.now();
        let processedLinks = 0;
        const savePromises: Promise<LinkResponse>[] = [];

        const processLink = async (link) => {
            try {
                if (link.link.endsWith(".pdf")) {
                    await processPDFLink(link);
                } else {
                    await processHTMLLink(link);
                }
            } catch (error) {
                Logger.error(
                    `Error processing link ${link.id}:`,
                    getErrorMessage(error)
                );
                link.skippedErrorFetchingFullText = true;
            } finally {
                // for some reason this is added wrongly sometimes
                if (link.fullText) {
                    link.skippedErrorFetchingFullText = false;
                    link.skippedNotProbablyReadable = false;
                    link.skippedInaccessiblePDF = false;
                    link.deadLink = false;
                }

                // Always save the link, even if an error occurred
                savePromises.push(curiusLinkRepo.save(link));
            }
        };

        await Promise.all(links.map(processLink)); // Process links in parallel

        // Save all processed links at once
        await Promise.all(savePromises);

        const totalTime = (Date.now() - startTime) / 1000;
        Logger.info(
            `Finished processing ${totalLinks} links in ${totalTime.toFixed(
                2
            )}s`
        );
    } catch (error) {
        Logger.error("Unexpected error:", getErrorMessage(error));
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
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

const processHTMLLink = async (link) => {
    try {
        Logger.info(`Fetching link: ${link.id} (${link.link})`);
        const response = await fetch(link.link); // Add a timeout

        if (!response.ok) {
            if (response.status === 404 || response.status === 410) {
                link.deadLink = true;
                Logger.info(`Dead link detected: ${link.id} (${link.link})`);
            } else {
                link.skippedErrorFetchingFullText = true;
                Logger.info(
                    `Error fetching link: ${link.id} (${link.link}), status: ${response.status}`
                );
            }
            return;
        }

        const html = await response.text();

        const { window } = new JSDOM(html);
        if (!isProbablyReaderable(window.document)) {
            link.skippedNotProbablyReadable = true;
            Logger.info(
                `Link not probably readable: ${link.id} (${link.link})`
            );
            return;
        }

        const result = new Readability(window.document).parse();
        if (!result) {
            link.skippedErrorFetchingFullText = true;
            Logger.info(
                `Failed to parse content for: ${link.id} (${link.link})`
            );
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
        // Logger.info(`Successfully processed link: ${link.id} (${link.link})`);
    } catch (error) {
        Logger.error(
            `Error processing HTML link ${link.id}:`,
            getErrorMessage(error)
        );
        link.skippedErrorFetchingFullText = true;
    }
};

addFullTextToLinks().catch(console.error);
