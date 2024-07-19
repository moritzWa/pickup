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

// every 30 minutes
const CRON = "*/30 * * * *";
const NAME = "Check Dead Tokens";

const checkDeadTokens = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async ({ step }) => {
        const start = Date.now();

        await step.run("is-dead-token", async () => {
            const resp = await TokenService.checkDeadTokens();
            if (resp.isFailure()) {
                throw new Error(resp.error.message);
            }
        });

        const end = Date.now();

        logHistogram({
            metric: "check_dead_tokens.duration",
            value: end - start,
            logIfOver: 30_000,
        });

        console.log(`Successfully checked dead tokens.`);
    }
);

export { checkDeadTokens };
