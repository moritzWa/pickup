// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import BigNumber from "bignumber.js";
import { connect } from "src/core/infra/postgres";
import { AccountProvider, TradingSide } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { quoteRepo } from "src/modules/trading/infra/postgres";
import { QuoteService, SwapService } from "src/modules/trading/services";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { helius } from "src/utils";
import { getPriceV2, jup } from "src/utils/jupiter";
import { v4 as uuidv4 } from "uuid";

export const run = async () => {
    const userResponse = await pgUserRepo.findByEmail(
        "andrew.j.duca@gmail.com"
    );

    const solWallet = (userResponse.value.wallets ?? []).find(
        (w) => w.provider === AccountProvider.Solana
    );

    const amount = new BigNumber(1);

    const send = {
        contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        provider: AccountProvider.Solana,
    };

    const receive = {
        contractAddress: "3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN",
        provider: AccountProvider.Solana,
    };

    const quoteResponse = await QuoteService.getBestQuote(
        userResponse.value,
        AccountProvider.Solana,
        TradingSide.Buy,
        amount.toNumber(),
        send,
        receive,
        1_000 // 10% slippage
    );

    debugger;

    const swapResponse = await SwapService.getSwapInfo({
        quote: quoteResponse.value.bestQuote,
        signerWalletAddress: solWallet?.publicKey ?? "",
        provider: AccountProvider.Solana,
    });

    debugger;

    // what if I want to try submitting it now?
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
