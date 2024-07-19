import { AccountProvider, User } from "src/core/infra/postgres/entities";
import { JupiterService } from "../tradingProviders";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    success,
} from "src/core/logic";
import { AssetType, TradingSide } from "src/core/infra/postgres/entities/types";
import { TradingQuote } from "../tradingProviders/types";
import BigNumber from "bignumber.js";
import {
    NexusGenInputs,
    NexusGenObjects,
} from "src/core/surfaces/graphql/generated/nexus";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { quoteRepo } from "../../infra/postgres";
import { v4 as uuidv4 } from "uuid";
import { FeeService } from "src/shared/feeService/feeService";

type TokenInOrOutInfo = {
    tokenContractAddress: string;
    decimals: number;
};

type QuoteParams = {
    side: TradingSide;
    provider: AccountProvider;
    amount: BigNumber;
    sell: TokenInOrOutInfo;
    buy: TokenInOrOutInfo;
    maxSlippageBps: number;
    feeBps: number;
    userWalletAddress: string | null;
    user: User | null;
};

const getQuote = async (
    params: QuoteParams
): Promise<FailureOrSuccess<DefaultErrors, TradingQuote>> => {
    if (params.provider === AccountProvider.Solana) {
        return JupiterService.getQuote({
            provider: params.provider,
            user: params.user,
            sell: params.sell,
            buy: params.buy,
            side: params.side,
            amount: params.amount,
            tokenType: AssetType.FungibleToken,
            maxSlippageBps: params.maxSlippageBps,
            feeBps: params.feeBps,
            userWalletAddress: params.userWalletAddress,
        });
    }

    return failure(
        new Error("We do not support any chains besides Solana at this time.")
    );
};

const getBestQuote = async (
    user: User | null,
    chain: AccountProvider,
    side: "buy" | "sell",
    amountToPurchase: number,
    send: NexusGenInputs["QuoteAsset"],
    receive: NexusGenInputs["QuoteAsset"],
    _maxSlippageBps: number | null
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            bestQuote: NexusGenObjects["Quote"];
        }
    >
> => {
    if (user) {
        console.log(`[building quote for ${user.email} (${user.id})]`);
    }

    const wallet = (user?.wallets ?? []).find(
        (wallet) => wallet.provider === chain
    );

    // don't need to be a user
    if (user && !wallet) {
        return failure(
            new Error(
                "User does not have a wallet for the chain. Please contact customer support."
            )
        );
    }

    const userWalletAddress = wallet?.publicKey ?? null;

    const [sendTokenResponse, receiveTokenResponse] = await Promise.all([
        TokenService.getToken({
            provider: chain,
            contractAddress: send.contractAddress,
        }),
        TokenService.getToken({
            provider: chain,
            contractAddress: receive.contractAddress,
        }),
    ]);

    if (sendTokenResponse.isFailure()) {
        return failure(sendTokenResponse.error);
    }

    if (receiveTokenResponse.isFailure()) {
        return failure(receiveTokenResponse.error);
    }

    const sendToken = sendTokenResponse.value;
    const receiveToken = receiveTokenResponse.value;
    const maxSlippageBps =
        _maxSlippageBps ??
        // choose largest of the tokens involved
        Math.max(
            receiveToken.recommendedSlippageBps ?? 50,
            sendToken.recommendedSlippageBps ?? 50
        );

    // console.log(`[using slippage of ${maxSlippageBps}]`);

    // if it is the buy side, subtract the fee in BPS from this
    const feeBps = FeeService.getFeeBps();
    // if they are buying, we actually take the fee from the amount to purchase if the send token is USDC or SOL
    const _amount = new BigNumber(amountToPurchase);

    const feeAmount = await FeeService.getSendTokenFeeAmount({
        side: side === "buy" ? TradingSide.Buy : TradingSide.Sell,
        sendTokenContractAddress: sendToken.contractAddress,
        amount: _amount,
        chain: chain,
        feeBps,
    });

    const adjustedAmount = _amount.minus(feeAmount);

    console.log(`[quote input amount is: ${adjustedAmount.toNumber()}]`);

    const quoteResponse = await QuoteService.getQuote({
        user: user,
        provider: AccountProvider.Solana,
        maxSlippageBps: maxSlippageBps,
        sell: {
            tokenContractAddress: sendToken.contractAddress,
            decimals: sendToken.decimals,
        },
        buy: {
            tokenContractAddress: receiveToken.contractAddress,
            decimals: receiveToken.decimals,
        },
        side: side === "buy" ? TradingSide.Buy : TradingSide.Sell,
        amount: adjustedAmount,
        feeBps,
        userWalletAddress: userWalletAddress,
    });

    if (quoteResponse.isFailure()) {
        return failure(quoteResponse.error);
    }

    const quote = quoteResponse.value;
    const providerQuote = quoteResponse.value;
    const quoteId = uuidv4();

    const dbQuoteResponse = await quoteRepo.create({
        id: quoteId,
        chain: AccountProvider.Solana,
        sendSymbol: sendToken.symbol,
        fees: quote.fees,
        platformFeeBps: quote.platformFeeBps,
        sendIconImageUrl: sendToken.iconImageUrl,
        receiveIconImageUrl: receiveToken.iconImageUrl,
        estimatedFeeValueCents: quote.estimatedFeeValueCents,
        recommendedSlippageBps: maxSlippageBps,
        estimatedSwapFiatAmountCents:
            quote.receivedFiatAmountCents || quote.sendFiatAmountCents,
        receiveSymbol: receiveToken.symbol,
        receiveTokenContractAddress: receiveToken.contractAddress,
        sendTokenContractAddress: sendToken.contractAddress,
        rawData: quote,
        sendAmount: providerQuote.sendAmount,
        sendFiatAmountCents: new BigNumber(providerQuote.sendFiatAmountCents),
        sendFiatCurrency: providerQuote.sendFiatCurrency,
        receiveAmount: providerQuote.receivedAmount,
        receiveFiatAmountCents: new BigNumber(
            providerQuote.receivedFiatAmountCents
        ),
        receiveFiatCurrency: providerQuote.receivedFiatCurrency,
        provider: providerQuote.provider,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    if (dbQuoteResponse.isFailure()) {
        return failure(dbQuoteResponse.error);
    }

    const dbQuote = dbQuoteResponse.value;

    return success({
        bestQuote: dbQuote,
        timestamp: new Date(),
    });
};

export const QuoteService = {
    getQuote,
    getBestQuote,
};
