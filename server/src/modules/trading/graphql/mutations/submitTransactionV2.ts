import {
    queryField,
    nullable,
    objectType,
    nonNull,
    idArg,
    stringArg,
    mutationField,
    floatArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { SwapService } from "../../services/swapService";
import {
    D,
    Datadog,
    Slack,
    SlackChannel,
    helius,
    jito,
    logHistogram,
} from "src/utils";
import {
    AccountProvider,
    CurrencyCode,
    DEFAULT_SWAP_PRIVACY,
    Quote,
    Referral,
    Swap,
    ReferralCommission,
    SwapPrivacy,
    User,
} from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";
import {
    quoteRepo,
    swapEventRepo,
    swapFeeRepo,
    swapRepo,
} from "../../infra/postgres";
import { SolanaError, _tryToSendRaw, solana } from "src/utils/solana";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { SwapStatus, SwapType } from "src/core/infra/postgres/entities/Trading";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { v4 as uuidv4 } from "uuid";
import { inngest, sendToInngest } from "src/jobs/inngest/clients";
import {
    InngestEventName,
    SubmitTransactionData,
} from "src/jobs/inngest/types";
import { AnalyticsService, EventName } from "src/shared/analyticsService";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import BigNumber from "bignumber.js";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { IdempotencyService } from "src/shared/idempotencyService";
import base58 = require("bs58");
import { jitoConnection } from "src/utils/helius/constants";
import { SWAP_PRIVACY_TO_DOMAIN, SWAP_TYPE_TO_DOMAIN } from "../types";
import {
    referralCommissionRepo,
    referralRepo,
} from "src/modules/referral/infra";
import { dataSource } from "src/core/infra/postgres";
import { EntityManager, In } from "typeorm";
import {
    PnlInfo,
    TokenPnlService,
} from "src/modules/portfolio/services/tokenPnlService";
import { loops } from "src/utils/loops";
import { DEFAULT_COMMISSION_PERCENT } from "src/core/infra/postgres/entities/User";
import { UserService } from "src/modules/users/services";

const SIGNUP_CODES: {
    code: string;
    provider: AccountProvider;
    contractAddress: string;
}[] = [
    {
        code: "jason",
        provider: AccountProvider.Solana,
        contractAddress: "6SUryVEuDz5hqAxab6QrGfbzWvjN8dC7m29ezSvDpump",
    },
    {
        code: "lilpump",
        provider: AccountProvider.Solana,
        contractAddress: "9vrGUHwsC8LyLjQoh3zJb9S53x7A88u49La63qPB6F5t",
    },
];

export const submitTransactionV2 = mutationField("submitTransactionV2", {
    type: nonNull("SubmitTransactionResponse"),
    args: {
        quoteId: nonNull(idArg()),
        chain: nonNull("AccountProviderEnum"),
        blockHeight: nonNull(floatArg()),
        blockhash: nonNull(stringArg()),
        rawTransaction: nonNull(stringArg()),
        idempotency: nullable(stringArg()),
        privacy: nullable("SwapPrivacyEnum"),
        type: nullable("SwapTypeEnum"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const start = Date.now();

        const user = ctx.me!;
        const {
            blockHeight,
            rawTransaction,
            chain: _chain,
            idempotency,
            blockhash,
            privacy,
            type: _type,
        } = args;
        const type = _type ? SWAP_TYPE_TO_DOMAIN[_type] : SwapType.Unknown;

        if (idempotency) {
            await IdempotencyService.checkAndThrowIfIdempotencyConflict(
                idempotency
            );
        }

        if (user.isBanned && type !== SwapType.Sell) {
            // sells are allowed for them to liquidity
            throw new ApolloError("You have been banned from buying.");
        }

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_chain];

        let signature: string | null = null;

        if (chain === AccountProvider.Solana) {
            const start = Date.now();
            // fire off to jito + solana nodes
            const signatureResponse = await solana.submitInitial(
                rawTransaction,
                blockhash,
                false
            );

            const end = Date.now();

            logHistogram({
                metric: "api.submit_transaction.latency",
                value: end - start,
            });

            throwIfErrorAndDatadog(signatureResponse, {
                datadogMetric: "api.submit_transaction.err",
                datadogTags: { chain, type: "submit_initial" },
            });

            signature = signatureResponse.value;
        }

        if (!signature) {
            Datadog.increment("api.submit_transaction.err", 1, {
                chain,
                type: "no_signature",
            });

            throw new ApolloError("Failed to get transaction.", "400");
        }

        console.time("creating-swap");
        const swapResponse = await _createSwap(
            user,
            args.quoteId,
            signature,
            privacy ? SWAP_PRIVACY_TO_DOMAIN[privacy] : null,
            type
        );
        console.timeEnd("creating-swap");

        throwIfErrorAndDatadog(swapResponse, {
            datadogMetric: "api.submit_transaction.err",
            datadogTags: { chain, type: "create_swap" },
        });

        const swap = swapResponse.value;

        const data: SubmitTransactionData = {
            swapId: swap.id,
            signature,
            blockHeight,
            userId: user.id,
            chain,
            rawTransaction,
        };

        await sendToInngest(
            async () =>
                await inngest.send({
                    data: data,
                    name: InngestEventName.SubmitTransaction,
                })
        );

        Datadog.increment("api.submit_transaction.ok", 1, { chain });

        const end = Date.now();

        logHistogram({
            metric: "api.submit_transaction.latency",
            value: end - start,
        });

        console.log(`[submit took ${end - start}ms]`);

        // attribute user to signup
        await _attributeNewUser(user, swap);

        return {
            signature,
            swapId: swapResponse.value.id,
        };
    },
});

const _createSwap = async (
    user: User,
    quoteId: string,
    hash: string,
    privacy: Maybe<SwapPrivacy>,
    type: SwapType
): Promise<FailureOrSuccess<DefaultErrors, Swap>> => {
    try {
        const quoteResponse = await quoteRepo.findById(quoteId);

        if (quoteResponse.isFailure()) {
            return failure(quoteResponse.error);
        }

        const quote = quoteResponse.value;

        // FIXME: add back later, too slow tho right now should do this async or something
        // const pnlResponse = await TokenPnlService.getPnl(
        //     user,
        //     quote.chain,
        //     quote.sendTokenContractAddress
        // );

        // const pnlInfo = pnlResponse.isSuccess() ? pnlResponse.value : null;

        const swapResponse = await _handleSwap(
            user,
            quote,
            hash,
            privacy,
            type,
            null // pnlInfo
        );

        if (swapResponse.isFailure()) {
            return failure(swapResponse.error);
        }

        const swap = swapResponse.value;

        void Slack.send({
            channel: SlackChannel.Swaps,
            format: true,
            message: [
                `💹 Swap Created by ${user.email} (${user.id})\n`,
                `Swap: ${swap.sendSymbol} (${new BigNumber(
                    swap.sendAmount
                )?.toNumber()}) -> ${swap.receiveSymbol} (${new BigNumber(
                    swap.receiveAmount
                )?.toNumber()})`,
                `Est. Value: ${D(
                    swap.estimatedSwapFiatAmountCents || 0,
                    CurrencyCode.USD
                ).toFormat()}`,
                `ID: ${swap.id}`,
                `Hash: ${swap.hash} (${swap.chain})`,
                `Block explorer: ${
                    BlockExplorerService.getBlockExplorerInfo(
                        swap.chain,
                        swap.hash
                    )?.url || ""
                }`,
            ].join("\n"),
        });

        AnalyticsService.track({
            userId: user.id,
            eventName: EventName.SwapCreated,
            properties: {
                chain: swap.chain,
                send_token: swap.sendSymbol,
                receive_token: swap.receiveSymbol,
                amount_usd: swap.estimatedSwapFiatAmountCents,
            },
        });

        // just void bc we don't want to wait for this just in case it hangs
        void loops.events.send(user.email, "Trade Submitted");

        return success(swap);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _handleSwapCommission = async (
    swap: Swap,
    referrals: Referral[],
    dbTxn: EntityManager
): Promise<FailureOrSuccess<DefaultErrors, Maybe<ReferralCommission>>> => {
    if (!referrals.length) return success(null);

    const ref = referrals[0];
    if (!ref) return success(null);

    const referredBy = await pgUserRepo.findById(ref.referredByUserId);

    const user = referredBy.isSuccess() ? referredBy.value : null;

    const commission = new BigNumber(swap.estimatedFeeFiatAmountCents ?? 0)
        .multipliedBy(user?.commissionPercentage ?? DEFAULT_COMMISSION_PERCENT)
        .dp(0);

    return referralCommissionRepo.create(
        {
            id: uuidv4(),
            referralId: ref.id,
            swapId: swap.id,
            hash: swap.hash,
            chain: swap.chain,
            createdAt: swap.createdAt,
            updatedAt: swap.updatedAt,
            commissionFiatAmountCents: commission.toNumber(),
            estimatedFeeFiatAmountCents: swap.estimatedFeeFiatAmountCents,
            estimatedSwapFiatAmountCents: swap.estimatedSwapFiatAmountCents,
            commissionRecipientUserId: ref.referredByUserId,
            traderUserId: swap.userId,
        },
        dbTxn
    );
};

const _getEstimatedPnL = (
    type: SwapType,
    pnlInfo: PnlInfo | null,
    sentAmount: BigNumber
): BigNumber | null => {
    if (type !== SwapType.Sell) {
        return null;
    }

    if (!pnlInfo) {
        return null;
    }
    const totalReturn = pnlInfo.totalReturnFiatCents;

    if (!totalReturn) {
        return null;
    }

    const holding = pnlInfo.position.amount;
    const percentageSold = sentAmount.div(holding);
    const estimatedReturn = percentageSold.multipliedBy(totalReturn);

    return estimatedReturn;
};

const _handleSwap = async (
    user: User,
    quote: Quote,
    hash: string,
    privacy: Maybe<SwapPrivacy>,
    type: SwapType,
    pnlInfo: PnlInfo | null
): Promise<FailureOrSuccess<DefaultErrors, Swap>> => {
    try {
        let swap: Maybe<Swap> = null;

        const estimatedPnL = _getEstimatedPnL(type, pnlInfo, quote.sendAmount);

        await dataSource.transaction(async (dbTxn) => {
            // FIXME: these are estimates -> have to look at the onchain txn to get the actual values
            const swapResponse = await swapRepo.create(
                {
                    status: SwapStatus.Pending,
                    quoteId: quote.id,
                    sendSymbol: quote.sendSymbol,
                    failedReason: null,
                    receiveSymbol: quote.receiveSymbol,
                    estimatedPnLFiatAmountCents:
                        estimatedPnL?.toNumber() ?? null,
                    sendAmount: quote.sendAmount,
                    receiveAmount: quote.receiveAmount,
                    receiveIconImageUrl: quote.receiveIconImageUrl,
                    sendIconImageUrl: quote.sendIconImageUrl,
                    estimatedFeeFiatAmountCents: quote.estimatedFeeValueCents,
                    receiveTokenContractAddress:
                        quote.receiveTokenContractAddress,
                    sendTokenContractAddress: quote.sendTokenContractAddress,
                    hash,
                    type,
                    id: uuidv4(),
                    provider: quote.provider,
                    chain: quote.chain,
                    userId: user.id,
                    estimatedSwapFiatAmountCents:
                        quote.estimatedSwapFiatAmountCents,
                    finalizedAt: null,
                    privacy: privacy ?? DEFAULT_SWAP_PRIVACY,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                dbTxn
            );

            if (swapResponse.isFailure()) {
                throw swapResponse.error;
            }

            // set the swap
            swap = swapResponse.value;

            let referrals: Referral[] = [];

            if (swap.userId) {
                const referralResponse =
                    await referralRepo.findReferralsClientWasReferred(
                        swap.userId
                    );

                if (referralResponse.isFailure()) {
                    throw referralResponse.error;
                }

                referrals = referralResponse.value;
            }

            const feeAmount = new BigNumber(
                swap.estimatedFeeFiatAmountCents ?? 0
            );

            const commissionSwapResponse = await _handleSwapCommission(
                swap,
                referrals,
                dbTxn
            );

            if (commissionSwapResponse.isFailure()) {
                throw commissionSwapResponse.error;
            }

            const commission = commissionSwapResponse.value;

            const revenue = feeAmount.minus(
                commission?.commissionFiatAmountCents ?? 0
            );

            await swapFeeRepo.create(
                {
                    swapId: swap.id,
                    hash: swap.hash,
                    chain: swap.chain,
                    estimatedFeeFiatAmountCents: feeAmount.toNumber(),
                    estimatedFeeFiatAmountRevenueCents: revenue.toNumber(),
                    estimatedSwapFiatAmountCents:
                        swap.estimatedSwapFiatAmountCents,
                    id: uuidv4(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                dbTxn
            );
        });

        if (!swap) {
            return failure(new Error("Swap not created"));
        }

        return success(swap);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _attributeNewUser = async (
    user: User,
    swap: Swap
): Promise<FailureOrSuccess<DefaultErrors, Maybe<string>>> => {
    try {
        if (hasValue(user.referredByCode) && user.referredByCode.length > 0)
            return success(null);

        // find signup code
        const signupCode = SIGNUP_CODES.find(
            (code) =>
                code.provider === swap.chain &&
                code.contractAddress === swap.receiveTokenContractAddress
        );
        if (!signupCode) return success(null);

        // get previous swaps
        const prevSwapsResp = await SwapService.find({
            where: {
                userId: user.id,
                status: In([SwapStatus.Confirmed, SwapStatus.Finalized]),
            },
        });
        if (prevSwapsResp.isFailure()) {
            throw new Error("Failed to find previous swaps");
        }
        const prevSwaps = prevSwapsResp.value;
        if (prevSwaps.length > 0) return success(null);

        // update user
        const updateUserResp = await UserService.update(user.id, {
            referredByCode: signupCode.code,
        });
        if (updateUserResp.isFailure()) {
            throw new Error(
                "Failed to update user when attributing referred_by_code"
            );
        }
        return success(signupCode.code);
    } catch (e) {
        void Slack.send({
            channel: SlackChannel.TradingUrgent,
            message: `Failed to attribute new user to signup code for user (${user.id}) swap (${swap.id}): ${e}`,
        });
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};
