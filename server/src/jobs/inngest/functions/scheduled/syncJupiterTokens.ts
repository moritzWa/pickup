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
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { DefaultErrors, FailureOrSuccess, success } from "src/core/logic";
import { SyncJupiterTokensService } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService";
import { throwIfError } from "src/core/surfaces/graphql/common";

// every 1 minute
const CRON = "*/1 * * * *";
const NAME = "Sync Jupiter Tokens";

const syncJupiterTokens = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async ({ step }) => {
        const start = Date.now();

        await step.run("fetch-new-jupiter-tokens", async () => {
            // fetch tokens
            const resp = await SyncJupiterTokensService.fetchNewJupiterTokens();
            console.log(resp);
            if (resp.isFailure()) {
                throw new Error(resp.error.message);
            }
        });

        await step.run("update-jupiter-created-at", async () => {
            const resp =
                await SyncJupiterTokensService.updateJupiterCreatedAt();
            console.log(resp);
            if (resp.isFailure()) {
                throw new Error(resp.error.message);
            }
        });

        await step.run("update-jupiter-market-caps", async () => {
            const resp =
                await SyncJupiterTokensService.updateJupiterMarketCaps();
            console.log(resp);
            if (resp.isFailure()) {
                throw new Error(resp.error.message);
            }
        });

        const end = Date.now();

        logHistogram({
            metric: "sync_jupiter_tokens.duration",
            value: end - start,
            logIfOver: 30_000,
        });

        console.log(`Successfully synced jupiter tokens.`);
    }
);

export { syncJupiterTokens };

// if we are calling this file call the above function
if (require.main === module) {
    connect()
        .then(async () => {
            await SyncJupiterTokensService.fetchNewJupiterTokens();
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
