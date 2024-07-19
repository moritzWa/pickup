import { Datadog, coingecko, logHistogram } from "src/utils";
import { Slack, SlackChannel } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { In, LessThan } from "typeorm";
import moment = require("moment");
import { swapRepo } from "src/modules/trading/infra/postgres";
import { UserNotificationService } from "src/modules/users/services/userNotificationService";
import { connect } from "src/core/infra/postgres";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { InngestEventName } from "../../types";
import { SwapStatusService } from "src/modules/trading/services/swapService/swapStatusService";

// every 5 minutes
const CRON = "*/1 * * * *";
const NAME = "Sync Pending Swaps";

const syncPendingSwaps = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async () => await runCron()
);

const runCron = async () => {
    // console.log("[building current coingecko price cache]");

    const start = Date.now();

    const status = In([SwapStatus.Pending, SwapStatus.Processed]);

    const totalPendingResponse = await swapRepo.count({
        where: {
            status: status,
        },
    });

    if (totalPendingResponse.isFailure()) {
        throw totalPendingResponse.error;
    }

    const totalPending = totalPendingResponse.value;

    // get 25 of the pending txns and attempt to sync the transactions
    const swapsResponse = await swapRepo.find({
        where: {
            status: status,
        },
        order: { createdAt: "asc" },
        take: 25,
    });

    if (swapsResponse.isFailure()) {
        throw swapsResponse.error;
    }

    console.log(`[syncing ${swapsResponse.value.length} pending swaps]`);
    // call sync swap on each of the swaps
    for (const swap of swapsResponse.value) {
        await SwapStatusService.syncStatus(swap);
    }

    const end = Date.now();

    logHistogram({
        metric: "sync_pending_swaps.total",
        value: totalPending,
    });

    logHistogram({
        metric: "sync_pending_swaps.duration",
        value: end - start,
        logIfOver: 30_000,
    });

    console.log(`Successfully synced pending swaps.`);
};

export { syncPendingSwaps };

// // if we are calling this file call the above function
if (require.main === module) {
    connect()
        .then(() => runCron())
        .catch(console.error)
        .finally(() => process.exit(1));
}
