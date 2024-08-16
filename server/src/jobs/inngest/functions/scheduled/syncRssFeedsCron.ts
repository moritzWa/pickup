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

// cron to run at 12am PST
const CRON = "0 7 * * *";
const NAME = "Sync RSS Feed Cron";

const syncRSSFeedCron = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async ({}) => {
        const usersResponse = await pgUserRepo.find({ select: { id: true } });

        throwIfError(usersResponse);

        const userIds = usersResponse.value.map((user) => user.id);

        const podcasts = PODCASTS;
        const insertionId = uuidv4();

        for (const podcast of podcasts) {
            const contentResponse = await RSSFeedService.scrapeRssFeed(
                podcast.url,
                podcast.name,
                ContentType.PODCAST
            );

            if (contentResponse.isFailure()) {
                throw contentResponse.error;
            }

            const content = contentResponse.value;

            const upsertedResponse = await RSSFeedService.upsertRssFeed(
                content
            );

            if (upsertedResponse.isFailure()) {
                throw upsertedResponse.error;
            }
        }
    }
);

export { syncRSSFeedCron };
