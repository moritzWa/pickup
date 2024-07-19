// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import { Keypair } from "@solana/web3.js";
import base58 = require("bs58");
import { connect } from "src/core/infra/postgres";
import { swapRepo } from "src/modules/trading/infra/postgres";
import { SwapStatusService } from "src/modules/trading/services/swapService/swapStatusService";
import { isVersionLessThan } from "src/modules/users/graphql";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { helius } from "src/utils";
import { algolia } from "src/utils/algolia";
import { connection } from "src/utils/helius/constants";
import { solana } from "src/utils/solana";
import { twilio } from "src/utils/twilio";

export const run = async () => {
    const response = isVersionLessThan("1.1.1", "1.1.2");

    debugger;
    // const swapResponse = await swapRepo.findById(
    //     "26b14bf7-91b9-4e25-acdd-1cb2147652e4"
    // );

    // await SwapStatusService.syncStatus(swapResponse.value);
    // // google voice: 3479039877

    // // personal: 8589997892
    // const statusResponse = await solana.getFailedReason(
    //     // connection,
    //     "4zXJzSGobnKzzTRLUDStM7vm4KW2Mi1zCeRxMwMQnfk9DLnRiG7PtJrrqKEdCGYVY3wN2mMebfzQ4EJWaXENQ6wH"
    // );

    // debugger;

    // await twilio.phoneNumberIsAllowed("+18589997892");

    // debugger;

    console.time("algolia");

    // while (true) {
    //     const resp = await connection.getLatestBlockhash("processed");

    //     console.log(resp);

    //     debugger;
    // }

    // turn list of integers into private key
    const key = [];
    const keypair = Keypair.fromSecretKey(Uint8Array.from(key));

    console.log(keypair.publicKey.toBase58());
    console.log(base58.encode(keypair.secretKey));

    debugger;

    console.timeEnd("algolia");

    const token = await solana.getAccountSizeForMint(
        "3psH1Mj1f7yUfaD5gh6Zj7epE8hhrMkMETgv5TshQA4o"
    );

    const res = await helius.transactions.findBySignature(
        "5B5YEHqrNqsgMJoSSQNEdMuHB5tRMt6YzDDtiMpmSrpCutptrtA8iCFhnKQGXeSsuKcfgzokwQpP12x7eyw2vFRC"
    );

    console.log(res);
    // await helius.
    // 'F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk'
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
