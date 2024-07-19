import axios from "axios";
import { UnexpectedError, failure, success } from "src/core/logic";
import { DefaultErrors, FailureOrSuccess, Maybe } from "src/core/logic";
import {
    GetQuoteParams,
    TradingQuote,
    TradingInterface,
    BuildTransactionParams,
    TradingTransaction,
    TokenInOrOutInfo,
} from "./types";
import { JupiterQuote, jup } from "src/utils/jupiter";
import {
    TradingProvider,
    TradingSide,
    WalletProvider,
} from "src/core/infra/postgres/entities/types";
import { CurrencyCode } from "src/shared/domain";
import { CoinGeckoTokenId } from "src/utils/coingecko/types";
import BigNumber from "bignumber.js";
import { VersionedTransaction } from "@solana/web3.js";
import * as bs from "bs58";
import { ZERO_BN, helius } from "src/utils";
import { SOL_USDC_MINT } from "src/shared/integrations/providers/solana/constants";
import { WRAPPED_SOL_MINT } from "src/utils/solana";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { QuoteTradingFee } from "src/core/infra/postgres/entities/Trading";
import { User } from "src/core/infra/postgres/entities";

const USDC_TOKEN_ACCOUNT_FEE = new BigNumber(0.5);

const STABLE_COINS = new Set([
    // USDC
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
]);

const IS_PEGGED_TOKEN = new Set([
    "6SUryVEuDz5hqAxab6QrGfbzWvjN8dC7m29ezSvDpump",
]);

const MAX_ACCOUNTS = 64;

const _getFiatAmount = async (
    amount: BigNumber,
    token: TokenInOrOutInfo
): Promise<FailureOrSuccess<DefaultErrors, BigNumber | null>> => {
    if (STABLE_COINS.has(token.tokenContractAddress)) {
        return success(amount.multipliedBy(100).dp(0));
    }

    // get the conversion rate
    const priceResponse = await jup.prices.get([token.tokenContractAddress]);

    if (priceResponse.isFailure()) {
        return failure(priceResponse.error);
    }

    const data = priceResponse.value.data[token.tokenContractAddress];

    if (!data) {
        return success(null);
    }

    return success(amount.multipliedBy(data.price).multipliedBy(100).dp(0));
};

const _getFees = async (
    user: User | null,
    walletAddress: string | null,
    quote: JupiterQuote
): Promise<FailureOrSuccess<DefaultErrors, QuoteTradingFee[]>> => {
    // if swapping to / from SOL we don't charge fees bc the user pays them
    if (
        quote.inputMint === WRAPPED_SOL_MINT ||
        quote.outputMint === WRAPPED_SOL_MINT
    ) {
        return success([]);
    }

    // no fees when swapping to USDC
    if (quote.outputMint === SOL_USDC_MINT) {
        return success([]);
    }

    // just in case, this shouldn't happen but might as well cover it on the backend
    if (quote.inputMint !== SOL_USDC_MINT) {
        return failure(new Error("You can only trade using USDC or SOL."));
    }

    if (!user || !walletAddress) {
        return success([]);
    }

    const hasTokenAccountResponse = await helius.wallets.hasTokenAccount({
        walletAddress: walletAddress,
        mintAddress: quote.outputMint,
    });

    if (hasTokenAccountResponse.isFailure()) {
        return failure(hasTokenAccountResponse.error);
    }

    const { hasTokenAccount } = hasTokenAccountResponse.value;

    if (hasTokenAccount) {
        return success([]);
    }

    const fee: QuoteTradingFee = {
        type: "token_account",
        feeFiatAmountCents: USDC_TOKEN_ACCOUNT_FEE.multipliedBy(100).dp(0),
        tokenContractAddress: SOL_USDC_MINT,
        symbol: "USDC",
        amount: USDC_TOKEN_ACCOUNT_FEE, // 50 cents fee note: don't need to factor in decimals here it'll do that elsewhere
    };

    return success([fee]);
};

const getQuote = async (
    params: GetQuoteParams
): Promise<FailureOrSuccess<DefaultErrors, TradingQuote>> => {
    try {
        const { sell, buy, amount, side } = params;

        const decimals = sell.decimals;

        const amountToTrade = new BigNumber(amount).multipliedBy(
            new BigNumber(10).pow(decimals)
        );

        // input, output. the tokens we are inputting, to what we are outputting
        // the amount is always in terms of what we are inputting

        // otherwise, we are selling the input token to get the output token
        const quoteResponse = await jup.quotes.get({
            inputMint: sell.tokenContractAddress,
            outputMint: buy.tokenContractAddress,
            amount: amountToTrade,
            slippageBps: params.maxSlippageBps,
            potentialFeeBps: params.feeBps,
            maxAccounts: 40,
        });

        if (quoteResponse.isFailure()) {
            return failure(quoteResponse.error);
        }

        const quote = quoteResponse.value;

        const inAmount = new BigNumber(quote.inAmount).div(
            new BigNumber(10).pow(sell.decimals)
        );

        const outAmount = new BigNumber(quote.outAmount).div(
            new BigNumber(10).pow(buy.decimals)
        );

        const sendAmount = inAmount;
        const receiveAmount = outAmount;

        const [sendFiatAmountCentsResponse, receiveFiatAmountCentsResponse] =
            await Promise.all([
                _getFiatAmount(sendAmount, sell),
                _getFiatAmount(receiveAmount, buy),
            ]);

        if (sendFiatAmountCentsResponse.isFailure()) {
            return failure(sendFiatAmountCentsResponse.error);
        }

        if (receiveFiatAmountCentsResponse.isFailure()) {
            return failure(receiveFiatAmountCentsResponse.error);
        }

        const amounts = _getReceiveAndSendAmount({
            receiveAmount,
            receiveFiatAmountCents: receiveFiatAmountCentsResponse.value,
            receiveTokenContractAddress: buy.tokenContractAddress,
            sendAmount,
            sendFiatAmountCents: sendFiatAmountCentsResponse.value,
            sendTokenContractAddress: sell.tokenContractAddress,
        });

        // console.log(amounts);

        const { receiveFiatAmountCents, sendFiatAmountCents } = amounts;

        const feeBpsMultiplier = new BigNumber(params.feeBps).div(100).div(100);
        // on buys, the sent amount pays the fee. on sells, it is the received amount
        const amountPayingFee =
            side === TradingSide.Buy
                ? sendFiatAmountCents
                : receiveFiatAmountCents;

        // just use whichever can get the estimate
        const feeValueEstimate = new BigNumber(
            sendFiatAmountCents?.toNumber() ||
                receiveFiatAmountCents?.toNumber() ||
                0
        ).multipliedBy(feeBpsMultiplier);

        const feesResponse = await _getFees(
            params.user,
            params.userWalletAddress,
            quote
        );

        if (feesResponse.isFailure()) {
            return failure(feesResponse.error);
        }

        const fees = feesResponse.value;

        const tradingQuote: TradingQuote = {
            provider: TradingProvider.Jupiter,
            providerImageUrl: "https://assets.awaken.tax/icons/jupiter.png",
            sendAmount: inAmount,
            receivedAmount: outAmount,
            rawSendAmount: new BigNumber(quote.inAmount),
            rawReceivedAmount: new BigNumber(quote.outAmount),
            side,
            sendFiatAmountCents: sendFiatAmountCents.toNumber(),
            receivedFiatAmountCents: receiveFiatAmountCents.toNumber(),
            sendFiatCurrency: CurrencyCode.USD,
            receivedFiatCurrency: CurrencyCode.USD,
            raw: quote,
            buy,
            sell,
            platformFeeBps: params.feeBps,
            estimatedFeeValueCents: feeValueEstimate.dp(0).toNumber(),
            fees: fees,
        };

        return success(tradingQuote);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _getReceiveAndSendAmount = ({
    receiveAmount,
    receiveFiatAmountCents,
    receiveTokenContractAddress,
    sendAmount,
    sendFiatAmountCents,
    sendTokenContractAddress,
}: {
    receiveTokenContractAddress: string;
    sendTokenContractAddress: string;
    receiveFiatAmountCents: BigNumber | null;
    receiveAmount: BigNumber;
    sendFiatAmountCents: BigNumber | null;
    sendAmount: BigNumber;
}): {
    match: "none" | "send" | "receive"; // this is just for me to test
    sendFiatAmountCents: BigNumber;
    receiveFiatAmountCents: BigNumber;
} => {
    if (sendTokenContractAddress === SOL_USDC_MINT) {
        const isPegged = IS_PEGGED_TOKEN.has(receiveTokenContractAddress);

        return {
            match: "send",
            sendFiatAmountCents:
                sendFiatAmountCents ??
                new BigNumber(sendAmount).multipliedBy(100),
            receiveFiatAmountCents:
                (isPegged ? sendFiatAmountCents : receiveFiatAmountCents) ??
                new BigNumber(sendAmount).multipliedBy(100),
        };
    }

    if (receiveTokenContractAddress === SOL_USDC_MINT) {
        return {
            match: "receive",
            sendFiatAmountCents:
                receiveFiatAmountCents ??
                new BigNumber(receiveAmount).multipliedBy(100),
            receiveFiatAmountCents:
                receiveFiatAmountCents ??
                new BigNumber(receiveAmount).multipliedBy(100),
        };
    }

    return {
        match: "none",
        sendFiatAmountCents: sendFiatAmountCents ?? ZERO_BN,
        receiveFiatAmountCents: receiveFiatAmountCents ?? ZERO_BN,
    };
};

const buildTransactionV2 = async ({
    quote,
    signerWalletAddress,
}: BuildTransactionParams): Promise<
    FailureOrSuccess<DefaultErrors, TradingTransaction>
> => {
    try {
        const jupiterQuote = quote.rawData?.raw as JupiterQuote;

        const transactionResponse = await jup.swap.buildTransactionV2(
            quote,
            jupiterQuote,
            signerWalletAddress,
            quote.platformFeeBps
        );

        if (transactionResponse.isFailure()) {
            return failure(transactionResponse.error);
        }

        const txn = transactionResponse.value;

        return success({
            solanaBlockhash: txn.blockhash,
            solanaLastValidBlockHeight: txn.lastValidBlockHeight,
            txn: txn.swapTransaction,
            wallet: WalletProvider.Awaken,
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const JupiterService: TradingInterface = {
    provider: TradingProvider.Jupiter,
    getQuote,
    buildTransaction: buildTransactionV2,
};
