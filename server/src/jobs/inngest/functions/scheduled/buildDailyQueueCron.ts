import { Datadog, logHistogram } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { InngestEventName } from "../../types";
import * as moment from "moment";
import { parallel } from "radash";

// cron to run at 3am UTC
const CRON = "0 3 * * *";
const NAME = "Build Daily Queue Cron";

const buildDailyQueueCron = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async ({}) => {
        const usersResponse = await pgUserRepo.find({ select: { id: true } });

        throwIfError(usersResponse);

        const userIds = usersResponse.value.map((user) => user.id);

        await parallel(10, userIds, async (userId) => {
            // idempotency for the build queue
            const id = moment().format("YYYY-MM-DD") + "-" + userId;

            await inngest.send({
                id,
                name: InngestEventName.BuildUserQueue,
                data: { userId },
            });
        });
    }
);

export { buildDailyQueueCron };
