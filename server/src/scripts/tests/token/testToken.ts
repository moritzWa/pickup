// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/tests/token/testCreateToken.ts

import { Dictionary, capitalize } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider, Token } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { Slack, SlackChannel, coingecko } from "src/utils";
import { birdeye } from "src/utils/birdeye";
import { DateTime } from "luxon";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    failureAndLog,
    hasValue,
    success,
} from "src/core/logic";
import { CurrentPriceService } from "src/modules/tokens/services/currentPriceService";
import { TradingIntegrationService } from "src/shared/integrations";

export const run = async () => {
    const tradingServiceResponse = TradingIntegrationService.getIntegration(
        AccountProvider.Solana
    );

    const tokenInfoResponse = await tradingServiceResponse.value.getToken({
        contractAddress: "4GJ3TCt5mTgQT5BRKb14AkjddpFQqKVfphxzS3t4foZ9",
    });

    const tokenInfo = tokenInfoResponse.value;

    const start = Date.now();
    const priceResponse = await CurrentPriceService.getCurrentPrice(tokenInfo);

    debugger;
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
