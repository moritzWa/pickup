import { Dictionary, keyBy } from "lodash";
import { fork } from "radash";
import { connect } from "src/core/infra/postgres";
import { Content } from "src/core/infra/postgres/entities";
import { contentRepo } from "src/modules/content/infra";
import { RSSFeedService } from "src/modules/content/services/rss/rssFeedService";
import { In } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ContentType } from "src/core/infra/postgres/entities/Content/Content";
import { PODCASTS } from "src/modules/content/services/podcasts/constants";

const scrapePodcasts = async () => {
    console.log(`[scraping ${PODCASTS.length} podcasts]`);

    debugger;

    for (const podcast of PODCASTS) {
        const contentResponse = await RSSFeedService.scrapeRssFeed(
            podcast.url,
            podcast.name,
            ContentType.PODCAST
        );

        if (contentResponse.isFailure()) {
            debugger;
            continue;
        }

        const content = contentResponse.value;

        const rssFeedResponse = await RSSFeedService.upsertRssFeed(content);

        if (rssFeedResponse.isFailure()) {
            debugger;
            continue;
        }

        const rssFeed = rssFeedResponse.value;

        console.log(`[inserted ${rssFeed.added} content]`);
        console.log(`[updated ${rssFeed.upserted} content]`);
        console.log(`[finished ${podcast.name}]`);
    }

    debugger;
};

// if running this main file, scrape all the podcasts
connect()
    .then(() => scrapePodcasts())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
