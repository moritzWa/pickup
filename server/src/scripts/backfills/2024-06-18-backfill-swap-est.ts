// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import BigNumber from "bignumber.js";
import { parallel } from "radash";
import { connect } from "src/core/infra/postgres";
import { PricingService } from "src/modules/portfolio/services/portfolioService/pricingService";
import { swapRepo } from "src/modules/trading/infra/postgres";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { loops } from "src/utils/loops";

const NOT_ALLOWED = new Set(["hotateman115826@gmail.com"]);

export const run = async () => {
    const swapsResponse = await swapRepo.find({
        where: [
            { estimatedSwapFiatAmountCents: 0, sendSymbol: "SOL" },
            { estimatedSwapFiatAmountCents: 0, receiveSymbol: "SOL" },
        ],
    });

    const swaps = swapsResponse.value;

    debugger;

    await parallel(3, swaps, async (a) => {
        const amountOfSol =
            a.sendSymbol === "SOL" ? a.sendAmount : a.receiveAmount;
        const price = new BigNumber(140_00);
        const estPrice = amountOfSol.multipliedBy(price);

        return swapRepo.update(a.id, {
            estimatedSwapFiatAmountCents: estPrice.toNumber(),
        });
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
