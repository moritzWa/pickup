import { Datadog, coingecko, logHistogram } from "src/utils";
import { Slack, SlackChannel } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { LessThan } from "typeorm";
import moment = require("moment");
import { swapRepo } from "src/modules/trading/infra/postgres";
import { UserNotificationService } from "src/modules/users/services/userNotificationService";
import { connect } from "src/core/infra/postgres";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { InngestEventName } from "../../types";
import { UserService } from "src/modules/users/services";
import { algolia } from "src/utils/algolia";

// every 1 minutes
const CRON = "*/1 * * * *";
const DAYS_AGO = 3;
const NAME = "Sync Usernames";

const syncUsernames = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async () => await runSyncUsernamesCron()
);

const runSyncUsernamesCron = async () => {
    const start = Date.now();
    const date = moment.utc().subtract({ days: DAYS_AGO });

    // grab all unsynced usernames
    const unsyncedUsernamesResp = await UserService.find({
        where: {
            usernameSynced: false,
        },
    });
    if (unsyncedUsernamesResp.isFailure()) {
        throw unsyncedUsernamesResp.error;
    }
    const unsyncedUsernames = unsyncedUsernamesResp.value;
    if (unsyncedUsernames.length === 0) {
        return;
    }

    // save them to algolia index
    const newAlgoliaUsers = unsyncedUsernames.map((u) => {
        return {
            objectID: u.username || "",
            username: u.username || "",
            name: u.name || "",
        };
    });
    await algolia.users.save(newAlgoliaUsers);

    // update synced status
    const bulkUpdateResp = await UserService.bulkUpdate(
        unsyncedUsernames.map((u) => u.id),
        { usernameSynced: true }
    );
    if (bulkUpdateResp.isFailure()) {
        throw bulkUpdateResp.error;
    }

    const end = Date.now();

    logHistogram({
        metric: "sync_usernames.duration",
        value: end - start,
        logIfOver: 30_000,
    });

    console.log(`Successfully synced usernames.`);
};

export { syncUsernames, runSyncUsernamesCron };

// // if we are calling this file call the above function
if (require.main === module) {
    connect()
        .then(() => runSyncUsernamesCron())
        .catch(console.error)
        .finally(() => process.exit(1));
}
