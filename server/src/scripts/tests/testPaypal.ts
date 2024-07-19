// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import { Keypair } from "@solana/web3.js";
import base58 = require("bs58");
import { connect } from "src/core/infra/postgres";
import { swapRepo } from "src/modules/trading/infra/postgres";
import { SwapStatusService } from "src/modules/trading/services/swapService/swapStatusService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { helius } from "src/utils";
import { algolia } from "src/utils/algolia";
import { connection } from "src/utils/helius/constants";
import { paypal } from "src/utils/paypal";
import { solana } from "src/utils/solana";
import { twilio } from "src/utils/twilio";

export const run = async () => {
    const response = await paypal.auth.bearer();

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
