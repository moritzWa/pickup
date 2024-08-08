import { Tags } from "hot-shots";
import { DefaultErrors, failure, FailureOrSuccess } from "src/core/logic";
import { Datadog } from "src/utils";
import SendGrid, {
    EmailData,
    SendGridTemplateData,
    TemplateName,
} from "src/utils/sendgrid";
import { Sentry } from "src/utils/sentry";
import { Slack } from "src/utils/slack";
import { trackError } from "src/utils/trackDatadog";
import { inngest } from "../clients";
import { InngestEventName } from "../types";
import { NonRetriableError, slugify } from "inngest";
import { contentRepo } from "src/modules/content/infra";
import { curiusLinkRepo } from "src/modules/curius/infra";
import { buildQueue } from "src/modules/content/services/queueService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { DEFAULT_LINKS_RETURN } from "src/modules/curius/infra/linkRepo";

const NAME = "Build User Queue";
const CONCURRENCY = 50;
const RETRIES = 3;

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
            const userResponse = await pgUserRepo.findById(userId);
            if (userResponse.isFailure()) throw userResponse.error;
            const user = userResponse.value;
            const response = await buildQueue(user, DEFAULT_LINKS_RETURN);
            if (response.isFailure()) throw response.error;
            return Promise.resolve();
        });

        return Promise.resolve();
    }
);

export { buildUserQueue };
