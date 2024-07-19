import { AccountProvider, Quote, Swap } from "src/core/infra/postgres/entities";
import { JupiterService } from "../tradingProviders";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
} from "src/core/logic";
import {
    AssetType,
    TradingProvider,
    WalletProvider,
} from "src/core/infra/postgres/entities/types";
import { TradingQuote, TradingTransaction } from "../tradingProviders/types";
import { swapRepo } from "../../infra/postgres";
import { FindManyOptions } from "typeorm";

type QuoteParams = {
    quote: Quote;
    provider: AccountProvider;
    signerWalletAddress: string;
};

type DecodeParams = {
    nonce: Maybe<string>;
    data: string;
};

const find = async (options: FindManyOptions<Swap>) => swapRepo.find(options);

const getSwapInfo = async (
    params: QuoteParams
): Promise<FailureOrSuccess<DefaultErrors, TradingTransaction>> => {
    const tradingProvider = params.quote.provider;

    if (tradingProvider === TradingProvider.Jupiter) {
        return JupiterService.buildTransaction({
            quote: params.quote,
            signerWalletAddress: params.signerWalletAddress,
            provider: params.provider,
        });
    }

    return failure(
        new Error("We do not support any chains besides Solana at this time.")
    );
};

export const SwapService = {
    find,
    getSwapInfo,
};
