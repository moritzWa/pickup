import { Datadog, logHistogram } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { InngestEventName } from "../../types";
import * as moment from "moment";
import { parallel } from "radash";
import { PODCASTS } from "src/modules/content/services/podcasts/constants";
import { RSSFeedService } from "src/modules/content/services/rss/rssFeedService";
import { ContentType } from "src/core/infra/postgres/entities/Content";
import { v4 as uuidv4 } from "uuid";

// cron to run every 4 hours
const CRON = "0 */4 * * *";
const NAME = "Sync RSS Feed Cron";

const syncRSSFeedCron = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async ({}) => {
        const podcasts = PODCASTS;
        const insertionId = uuidv4();

        await parallel(5, PODCASTS, _processPodcast(insertionId));
    }
);

const _processPodcast =
    (insertionId: string) => async (podcast: (typeof PODCASTS)[number]) => {
        const contentResponse = await RSSFeedService.scrapeRssFeed(
            podcast.url,
            podcast.name,
            ContentType.PODCAST,
            insertionId
        );

        if (contentResponse.isFailure()) {
            throw contentResponse.error;
        }

        const content = contentResponse.value;

        const upsertedResponse = await RSSFeedService.upsertRssFeed(content);

        if (upsertedResponse.isFailure()) {
            throw upsertedResponse.error;
        }

        console.log(
            `[${podcast.name}]: inserted: ${upsertedResponse.value.added}, updated: ${upsertedResponse.value.upserted}`
        );
    };

export { syncRSSFeedCron };
