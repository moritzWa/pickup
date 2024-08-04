// options:
// - https://www.npmjs.com/package/@postlight/parser <- current pick
// - https://www.npmjs.com/package/@mozilla/readability

// Parser.parse(url).then(result => console.log(result));

import { parse } from "@postlight/parser";
import { dataSource } from "src/core/infra/postgres";
import { FailureOrSuccess, Success } from "src/core/logic/FailureOrSuccess";
import { curiusLinkRepo } from "src/modules/curius/infra";

export const isSuccess = <E, V>(
    result: FailureOrSuccess<E, V>
): result is Success<never, V> => {
    return result.isSuccess();
};

const addFullTextToLinks = async () => {
    await dataSource.initialize();

    const linksResponse = await curiusLinkRepo.find();

    if (!isSuccess(linksResponse)) {
        console.error("Failed to fetch links:", linksResponse.error);
        await dataSource.destroy();
        return;
    }

    const links = linksResponse.value;
    const totalLinks = links.length;
    console.log(`Starting to process ${totalLinks} links...`);

    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        try {
            const result = await parse(link.link, {
                contentType: "markdown",
            });

            link.metadata = {
                ...link.metadata,
                full_text: result.content,
                author: result.author,
                date_published: result.date_published,
                excerpt: result.excerpt,
                word_count: result.word_count,
            };

            const saveResponse = await curiusLinkRepo.save(link);
            if (isSuccess(saveResponse)) {
                console.log(`Updated link ${link.id} (${i + 1}/${totalLinks})`);
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
                `Error processing link ${link.id} (${i + 1}/${totalLinks}):`,
                error
            );
        }

        // Log progress every 10 links
        if ((i + 1) % 10 === 0 || i === links.length - 1) {
            console.log(`Processed ${i + 1} of ${totalLinks} links`);
        }
    }

    console.log(`Finished processing ${totalLinks} links`);
    await dataSource.destroy();
};

addFullTextToLinks().catch(console.error);
