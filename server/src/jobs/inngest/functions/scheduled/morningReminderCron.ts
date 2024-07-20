import { Datadog, logHistogram } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";

// warm a few categories every 1 minute
const CRON = "*/1 * * * *";
const NAME = "Morning Reminder";

const morningReminderCron = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async ({ step }) => {
        const start = Date.now();

        // const warmCategoriesResp = await _warmCategories();
        // if (warmCategoriesResp.isFailure())
        //     throw new Error(warmCategoriesResp.error.message);

        const end = Date.now();

        logHistogram({
            metric: "morning_reminder_cron.duration",
            value: end - start,
            logIfOver: 30_000,
        });
    }
);

export { morningReminderCron };
