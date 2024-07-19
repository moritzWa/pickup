// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import { Keypair } from "@solana/web3.js";
import base58 = require("bs58");
import { connect } from "src/core/infra/postgres";
import { airdropClaimRepo } from "src/modules/airdrops/infra/postgres";
import { AirdropClaimService } from "src/modules/airdrops/services/airdropClaimService";
import { NotificationService } from "src/modules/notifications/services/notificationService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { formatNum, helius } from "src/utils";
import { algolia } from "src/utils/algolia";
import { connection } from "src/utils/helius/constants";
import { solana } from "src/utils/solana";
import { twilio } from "src/utils/twilio";

export const run = async () => {
    const claimResponse = await airdropClaimRepo.findById(
        "fa4e85d5-6bd6-4f81-a6dd-ab4eacfa1711",
        {
            relations: { airdrop: true },
        }
    );

    debugger;

    await AirdropClaimService.canClaim(claimResponse.value);

    debugger;

    const userResponse = await pgUserRepo.findByEmail(
        "andrew.j.duca@gmail.com"
    );

    const claim = claimResponse.value;

    await NotificationService.sendNotification(userResponse.value, {
        title: `Airdrop Claimed 🪂`,
        followerUserId: null,
        subtitle: `You received ${formatNum(claim.inviterAmount)} ${
            claim.airdrop.symbol
        }!`,
        iconImageUrl: claim.airdrop.iconImageUrl,
    });

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
