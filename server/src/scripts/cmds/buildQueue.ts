import { connect } from "src/core/infra/postgres";
import { buildQueue } from "src/modules/content/services/queueService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { contentRepo } from "src/modules/content/infra";
import _ = require("lodash");

export const run = async () => {
    const userResponse = await pgUserRepo.findByEmail(
        "andrew+testprod@awaken.tax"
    );

    // take all the content and seed a queue for each user
    const response = await buildQueue(userResponse.value, 10);

    if (response.isFailure()) {
        console.error("Failed to build queue:", response.error);
        return;
    }

    // Fetch full content details for each FeedItem
    const contentIds = response.value.map((item) => item.contentId);
    const contentResponse = await contentRepo.findByIds(contentIds);

    if (contentResponse.isFailure()) {
        console.error(
            "Failed to fetch content details:",
            contentResponse.error
        );
        return;
    }

    const contentMap = new Map(
        contentResponse.value.map((content) => [content.id, content])
    );

    // Log basic information about each FeedItem
    response.value.forEach((item, index) => {
        const content = contentMap.get(item.contentId);
        console.log(`  title: ${content?.title || "N/A"}`);
        console.log(`  url: ${content?.websiteUrl || "N/A"}`);
        console.log(`  type: ${content?.type || "N/A"}`);
        console.log("---");
    });

    console.log(`Total FeedItems: ${response.value.length}`);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
