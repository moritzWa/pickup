import { Datadog, logHistogram } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";
import { contentRepo } from "src/modules/content/infra";
import { ContentType } from "src/core/infra/postgres/entities/Content";
import { failure } from "src/core/logic";
import { InngestEventName } from "../../types";

// warm a few categories every 1 minute
const CRON = "*/30 * * * *";
const NAME = "Process Content Cron";

const processContentCron = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async ({ step }) => {
        const start = Date.now();

        const contentResponse =
            await contentRepo.findRandomUnprocessedPodcasts();

        if (contentResponse.isFailure()) {
            return failure(contentResponse.error);
        }

        console.log(`[processing ${contentResponse.value.length} content]`);

        for (const content of contentResponse.value) {
            await inngest.send({
                id: content.id,
                name: InngestEventName.ProcessContent,
                data: {
                    contentId: content.id,
                },
            });
        }
    }
);

export { processContentCron };
