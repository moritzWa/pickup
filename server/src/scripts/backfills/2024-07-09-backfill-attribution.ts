// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import BigNumber from "bignumber.js";
import { uniq } from "lodash";
import { parallel } from "radash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { hasValue } from "src/core/logic";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { PricingService } from "src/modules/portfolio/services/portfolioService/pricingService";
import { swapRepo } from "src/modules/trading/infra/postgres";
import { SwapService } from "src/modules/trading/services";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { UserService } from "src/modules/users/services";
import { loops } from "src/utils/loops";
import { IsNull } from "typeorm";

const NOT_ALLOWED = new Set(["hotateman115826@gmail.com"]);

// lilpump
const CONTRACT_ADDRESSES = [
    {
        ca: "9vrGUHwsC8LyLjQoh3zJb9S53x7A88u49La63qPB6F5t",
        code: "lilpump",
    },
    {
        ca: "6SUryVEuDz5hqAxab6QrGfbzWvjN8dC7m29ezSvDpump",
        code: "jason",
    },
];

const PROVIDER = AccountProvider.Solana;

export const run = async () => {
    for (const { ca, code } of CONTRACT_ADDRESSES) {
        console.log("ca", code, ca);

        // get all swaps for this contract address
        const swapsResp = await SwapService.find({
            select: ["userId"],
            where: {
                receiveTokenContractAddress: ca,
                chain: PROVIDER,
                user: {
                    referredByCode: IsNull(),
                },
            },
        });
        throwIfError(swapsResp);

        // get all users
        const userIds = uniq(swapsResp.value.map((s) => s.userId)).filter(
            hasValue
        );

        for (const userId of userIds) {
            // get first swap for user
            const mySwapsResp = await SwapService.find({
                where: {
                    userId,
                },
                order: { createdAt: "asc" },
                take: 1,
            });
            throwIfError(mySwapsResp);
            const mySwaps = mySwapsResp.value;
            if (mySwaps.length === 0) continue;
            const mySwap = mySwaps[0];

            // check if it's this contract address
            if (mySwap.receiveTokenContractAddress !== ca) continue;

            // attribute user to this referral code if it is
            const updateUserResp = await UserService.update(userId, {
                referredByCode: code,
            });
            throwIfError(updateUserResp);
        }
    }
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
