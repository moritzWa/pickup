// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import { Keypair } from "@solana/web3.js";
import base58 = require("bs58");
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { ChartService } from "src/modules/tokens/services/chartService";
import { swapRepo } from "src/modules/trading/infra/postgres";
import { SwapStatusService } from "src/modules/trading/services/swapService/swapStatusService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { Granularity } from "src/shared/domain";
import { TradingIntegrationService } from "src/shared/integrations";
import { SolanaTradingService } from "src/shared/integrations/providers/solana";
import { coingecko } from "src/utils";

export const run = async () => {
    const res = await coingecko.dex.getTokens(AccountProvider.Solana, [
        "3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN",
    ]);

    debugger;

    const integration = TradingIntegrationService.getIntegration(
        AccountProvider.Solana
    );

    const tokenResponse = await integration.value.getToken({
        contractAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    });
    const token = tokenResponse.value;

    const response = await ChartService.getLineChart(token, Granularity.Hour);

    console.log(JSON.stringify(response, null, 2));
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
