// options:
// - https://www.npmjs.com/package/@postlight/parser // uses private github dependency only accessible via ssh token
// - https://www.npmjs.com/package/@mozilla/readability <- current pick

import { Readability } from "@mozilla/readability";
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
    await dataSource.initialize();

    const linksResponse = await curiusLinkRepo.find();

    if (!isSuccess(linksResponse)) {
        console.error(
            "addFullTextColumn.ts:Failed to fetch links:",
            linksResponse.error
        );
        await dataSource.destroy();
        return;
    }

    const links = linksResponse.value;
    const totalLinks = links.length;
    console.log(
        `addFullTextColumn.ts: Starting to process ${totalLinks} links...`
    );

    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        try {
            let result;

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
                    const parsedPDF = await pdf(Buffer.from(pdfBuffer));
                    link.fullText = sanitizeText(parsedPDF.text);
                } else {
                    console.log(`Skipping inaccessible PDF: ${link.link}`);
                    continue; // Skip to the next link
                }
            } else {
                const { window } = new JSDOM(
                    await fetch(link.link).then((res) => res.text())
                );
                result = new Readability(window.document).parse();

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
                `addFullTextColumn.ts: Error processing link ${link.id} (${
                    i + 1
                }/${totalLinks}):`,
                error
            );
            continue; // Skip to the next link on error
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
    await dataSource.destroy();
};

addFullTextToLinks().catch(console.error);
