// options:
// - https://www.npmjs.com/package/@postlight/parser // uses private github dependency only accessible via ssh token
// - https://www.npmjs.com/package/@mozilla/readability <- current pick

import { isProbablyReaderable, Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { NodeHtmlMarkdown } from "node-html-markdown";
import * as pdf from "pdf-parse";
import { dataSource } from "src/core/infra/postgres";
import { FailureOrSuccess, Success } from "src/core/logic/FailureOrSuccess";
import { curiusLinkRepo } from "src/modules/curius/infra";

export const isSuccess = <E, V>(
    result: FailureOrSuccess<E, V>
): result is Success<never, V> => {
    return result.isSuccess();
};

const sanitizeText = (text: string) => {
    return text.replace(/\0/g, ""); // Remove null bytes
};

const addFullTextToLinks = async () => {
    try {
        await dataSource.initialize();

        const linksResponse = await curiusLinkRepo.findLinksWithoutFullText();

        if (!isSuccess(linksResponse)) {
            console.error(
                "addFullTextColumn.ts:Failed to fetch links without full text:",
                linksResponse.error
            );
            await dataSource.destroy();
            return;
        }

        const links = linksResponse.value;
        const totalLinks = links.length;
        console.log(
            `addFullTextColumn.ts: Starting to process ${totalLinks} links without full text...`
        );

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            try {
                let result;

                // Fetching PDF links
                if (link.link.endsWith(".pdf")) {
                    const response = await fetch(link.link);

                    // Check if the response is successful and the content type is PDF
                    if (
                        response.ok &&
                        response.headers
                            .get("content-type")
                            ?.includes("application/pdf")
                    ) {
                        const pdfBuffer = await response.arrayBuffer();
                        const parsedPDF = await pdf(Buffer.from(pdfBuffer), {
                            max: 20, // Limit to first 20 pages
                        });
                        link.fullText = sanitizeText(parsedPDF.text);

                        // Add metadata about PDF length
                        link.metadata = {
                            ...link.metadata,
                            totalPagesIfPDF: parsedPDF.numpages,
                            fetchedPagesIfPDF: parsedPDF.numrender,
                        };
                    } else {
                        console.log(`Skipping inaccessible PDF: ${link.link}`);
                        continue; // Skip to the next link
                    }

                    // not pdf
                } else {
                    try {
                        const response = await fetch(link.link);
                        if (!response.ok) {
                            console.error(`Failed to fetch link: ${link.link}`);
                            continue; // Skip to the next link
                        }

                        const { window } = new JSDOM(await response.text());

                        // Check if the document is probably readable
                        if (isProbablyReaderable(window.document)) {
                            result = new Readability(window.document).parse();
                        } else {
                            console.error(
                                `Skipping link as it is not probably readable: ${link.link}`
                            );
                            continue;
                        }
                    } catch (fetchError) {
                        // Handle specific fetch errors
                        if (fetchError instanceof Error) {
                            if (
                                fetchError.message.includes(
                                    "unable to verify the first certificate"
                                )
                            ) {
                                console.error(
                                    `Skipping link due to SSL certificate verification error: ${link.link}`,
                                    fetchError
                                );
                            } else if (
                                fetchError.message.includes(
                                    "SSL routines:ssl3_read_bytes:sslv3 alert handshake failure"
                                )
                            ) {
                                console.error(
                                    `Skipping link due to SSL handshake failure: ${link.link}`,
                                    fetchError
                                );
                            } else if (
                                fetchError.message.includes(
                                    "Hostname/IP does not match certificate's altnames"
                                )
                            ) {
                                console.error(
                                    `Skipping link due to certificate hostname mismatch: ${link.link}`,
                                    fetchError
                                );
                            } else {
                                console.error(
                                    `Skipping link due to fetch error: ${link.link}`,
                                    fetchError
                                );
                            }
                        } else {
                            console.error(
                                `Skipping link due to an unknown error: ${link.link}`,
                                fetchError
                            );
                        }
                        continue; // Skip to the next link on error
                    }

                    // Update link metadata
                    link.metadata = {
                        ...link.metadata,
                        length: result?.length,
                        excerpt: result?.excerpt,
                        byline: result?.byline,
                        dir: result?.dir,
                        siteName: result?.siteName,
                        lang: result?.lang,
                        publishedTime: result?.publishedTime,
                    };

                    link.title = result?.title || link.title;
                    link.fullText = NodeHtmlMarkdown.translate(
                        result?.content || ""
                    );
                }

                const saveResponse = await curiusLinkRepo.save(link);
                if (isSuccess(saveResponse)) {
                    console.log(
                        `addFullTextColumn.ts: Updated link ${link.id} (${
                            i + 1
                        }/${totalLinks})`
                    );
                } else {
                    console.error(
                        `Failed to update link ${link.id} (${
                            i + 1
                        }/${totalLinks}):`,
                        saveResponse.error
                    );
                }
            } catch (error) {
                console.error(
                    `Skipping link due to an unexpected error: ${link.link}`,
                    error
                );
                continue; // Skip to the next link on unexpected error
            }

            // Log progress every 10 links
            if ((i + 1) % 10 === 0 || i === links.length - 1) {
                console.log(
                    `addFullTextColumn.ts: Processed ${
                        i + 1
                    } of ${totalLinks} links`
                );
            }
        }

        console.log(
            `addFullTextColumn.ts: Finished processing ${totalLinks} links`
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
        console.error("addFullTextColumn.ts: Unexpected error:", error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
};

addFullTextToLinks().catch(console.error);
