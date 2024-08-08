// options:
// - https://www.npmjs.com/package/@postlight/parser // uses private github dependency only accessible via ssh token
// - https://www.npmjs.com/package/@mozilla/readability <- current pick

import { isProbablyReaderable, Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import * as pdf from "pdf-parse";
import { dataSource } from "src/core/infra/postgres";
import { curiusLinkRepo } from "src/modules/curius/infra";
import { getErrorMessage, isSuccess } from "./utils";

const sanitizeText = (text: string) => {
    return text.replace(/\0/g, ""); // Remove null bytes
};

const addFullTextToLinks = async () => {
    try {
        await dataSource.initialize();

        const linksResponse = await curiusLinkRepo.findFirst100Links();
        if (!isSuccess(linksResponse)) {
            console.error(
                "Failed to fetch links without full text:",
                linksResponse.error
            );
            return;
        }

        const links = linksResponse.value;
        const totalLinks = links.length;
        console.log(
            `Starting to process ${totalLinks} links without full text...`
        );

        const startTime = Date.now();
        let processedLinks = 0;

        for (const link of links) {
            try {
                if (link.link.endsWith(".pdf")) {
                    await processPDFLink(link);
                } else {
                    await processHTMLLink(link);
                }

                const saveResponse = await curiusLinkRepo.save(link);
                if (!isSuccess(saveResponse)) {
                    console.error(
                        `Failed to update link ${link.id}:`,
                        saveResponse.error
                    );
                }
            } catch (error) {
                console.error(
                    `Error processing link ${link.id}:`,
                    getErrorMessage(error)
                );
                link.skippedErrorFetchingFullText = true;
            }

            processedLinks++;
            if (processedLinks % 10 === 0 || processedLinks === totalLinks) {
                const progress = ((processedLinks / totalLinks) * 100).toFixed(
                    2
                );
                const elapsedTime = (Date.now() - startTime) / 1000;
                const avgTimePerLink = elapsedTime / processedLinks;
                console.log(
                    `Progress: ${progress}% (${processedLinks}/${totalLinks})`
                );
                console.log(`Avg time per link: ${avgTimePerLink.toFixed(2)}s`);
            }
        }

        const totalTime = (Date.now() - startTime) / 1000;
        console.log(
            `Finished processing ${totalLinks} links in ${totalTime.toFixed(
                2
            )}s`
        );
    } catch (error) {
        console.error("Unexpected error:", getErrorMessage(error));
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
        console.log(`Skipping inaccessible PDF: ${link.link}`);
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
    const response = await fetch(link.link);
    if (!response.ok) {
        throw new Error(`Failed to fetch link: ${link.link}`);
    }

    const { window } = new JSDOM(await response.text());
    if (!isProbablyReaderable(window.document)) {
        console.log(`Skipping non-readable link: ${link.link}`);
        link.skippedNotProbablyReadable = true;
        return;
    }

    const result = new Readability(window.document).parse();
    if (!result) {
        throw new Error(`Failed to parse content: ${link.link}`);
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
};

addFullTextToLinks().catch(console.error);
