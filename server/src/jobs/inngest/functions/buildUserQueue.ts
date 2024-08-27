import { slugify } from "inngest";
import { buildQueue } from "src/modules/content/services/queueService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { onesignal } from "src/utils/onesignal";
import { inngest } from "../clients";
import { InngestEventName } from "../types";

const NAME = "Build User Queue";
const CONCURRENCY = 50;
const RETRIES = 3;
const DEFAULT_NUMBER = 25;

const buildUserQueue = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: CONCURRENCY,
        retries: RETRIES,
    },
    { event: InngestEventName.BuildUserQueue },
    async ({ event, step, runId }) => {
        const userId = event.data.userId;

        await step.run("build-queue", async () => {
            console.log(`[building queue for ${userId}]`);

            const userResponse = await pgUserRepo.findById(userId);
            if (userResponse.isFailure()) throw userResponse.error;
            const user = userResponse.value;
            const response = await buildQueue(user, DEFAULT_NUMBER);
            if (response.isFailure()) throw response.error;

            await onesignal.notifications.send(user, {
                title: `New content is ready 👀`,
                message: "Check it out...",
            });

            return Promise.resolve();
        });

        return Promise.resolve();
    }
);

export { buildUserQueue };
