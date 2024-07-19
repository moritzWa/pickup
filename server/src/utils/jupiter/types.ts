import { Maybe } from "src/core/logic";
import BigNumber from "bignumber.js";

export type JupiterQuoteParams = {
    inputMint: string;
    outputMint: string;
    amount: BigNumber;
    slippageBps: number;
    potentialFeeBps: number;
    maxAccounts: number;
};

export type JupiterRouteSwapInfo = {
    ammKey: string;
    label: string; // ex. "Whirlpool",
    inputMint: string;
    outputMint: string;
    inAmount: string; // ex. "600000000",
    outAmount: string; // ex. "587773472",
    feeAmount: string; // ex. "1800",
    feeMint: string;
};

export type JupiterRoute = {
    swapInfo: JupiterRouteSwapInfo;
    percent: number;
};

export type JupiterQuote = {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string; // ex. "ExactIn",
    slippageBps: number; //50,
    platformFee: Maybe<number>;
    priceImpactPct: string; // "0",
    routePlan: JupiterRoute[];
    contextSlot: number;
    timeTaken: number;
};

export type JupiterTransaction = {
    swapTransaction: string;
    lastValidBlockHeight: number;
    blockhash: string;
};

export type JupiterPrice = {
    data: Record<
        string,
        {
            id: string;
            mintSymbol: string;
            vsToken: string;
            vsTokenSymbol: string;
            price: number; //
        }
    >;
    timeTaken: number;
};
