import {
    AssetType,
    TradingProvider,
    TradingSide,
    WalletProvider,
} from "src/core/infra/postgres/entities/types";
import { DefaultErrors, FailureOrSuccess, Maybe } from "src/core/logic";
import BigNumber from "bignumber.js";
import { AccountProvider, Quote, User } from "src/core/infra/postgres/entities";
import { JupiterQuote } from "src/utils/jupiter";
import { QuoteTradingFee } from "src/core/infra/postgres/entities/Trading";

export type TokenInOrOutInfo = {
    tokenContractAddress: string;
    decimals: number;
};

export type GetQuoteParams = {
    provider: AccountProvider;
    tokenType: AssetType;
    side: TradingSide;
    sell: TokenInOrOutInfo;
    buy: TokenInOrOutInfo;
    amount: BigNumber; // going to be a number like 1.2343
    maxSlippageBps: number;
    feeBps: number;
    user: User | null;
    userWalletAddress: string | null;
};

export type BuildTransactionParams = {
    quote: Quote;
    provider: AccountProvider;
    signerWalletAddress: string;
};

export type RawQuoteData = JupiterQuote;

export type TradingQuote = {
    side: TradingSide;
    provider: TradingProvider;
    providerImageUrl: Maybe<string>;
    buy: TokenInOrOutInfo;
    sell: TokenInOrOutInfo;
    sendAmount: BigNumber; // ex. 4.26
    rawSendAmount: BigNumber; // ex. 4000000000
    sendFiatAmountCents: number;
    sendFiatCurrency: string;
    receivedAmount: BigNumber; // ex. 1.234
    rawReceivedAmount: BigNumber; // ex. 1234000000
    receivedFiatAmountCents: number;
    receivedFiatCurrency: string;
    raw: RawQuoteData;
    platformFeeBps: number;
    estimatedFeeValueCents: number;
    fees: QuoteTradingFee[];
};

export type TradingTransaction = {
    wallet: WalletProvider;
    txn: string; // stringified data to submit for signature
    // for solana
    solanaLastValidBlockHeight: Maybe<number>;
    solanaBlockhash: Maybe<string>;
};

export type TradingInterface = {
    provider: TradingProvider;
    getQuote: (
        params: GetQuoteParams
    ) => Promise<FailureOrSuccess<DefaultErrors, TradingQuote>>;
    buildTransaction: (
        params: BuildTransactionParams
    ) => Promise<FailureOrSuccess<DefaultErrors, TradingTransaction>>;
};
