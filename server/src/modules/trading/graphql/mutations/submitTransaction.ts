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
import { D, Datadog, Slack, SlackChannel } from "src/utils";
import {
    AccountProvider,
    CurrencyCode,
    DEFAULT_SWAP_PRIVACY,
    SwapPrivacy,
    User,
} from "src/core/infra/postgres/entities";
import { ApolloError } from "apollo-server-errors";
import { quoteRepo, swapEventRepo, swapRepo } from "../../infra/postgres";
import { SolanaError, solana } from "src/utils/solana";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { SwapStatus, SwapType } from "src/core/infra/postgres/entities/Trading";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { v4 as uuidv4 } from "uuid";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { AnalyticsService, EventName } from "src/shared/analyticsService";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import BigNumber from "bignumber.js";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { IdempotencyService } from "src/shared/idempotencyService";
import { SWAP_PRIVACY_TO_DOMAIN, SWAP_TYPE_TO_DOMAIN } from "../types";

export const SubmitTransactionResponse = objectType({
    name: "SubmitTransactionResponse",
    definition(t) {
        t.nonNull.string("signature");
        t.nonNull.id("swapId");
    },
});

export const submitTransaction = mutationField("submitTransaction", {
    type: nonNull("SubmitTransactionResponse"),
    args: {
        quoteId: nonNull(idArg()),
        chain: nonNull("AccountProviderEnum"),
        blockHeight: nonNull(floatArg()),
        rawTransaction: nonNull(stringArg()),
        idempotency: nullable(stringArg()),
        privacy: nullable("SwapPrivacyEnum"),
        type: nullable("SwapTypeEnum"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const {
            blockHeight,
            rawTransaction,
            chain: _chain,
            idempotency,
            privacy,
            type: _type,
        } = args;
        const type = _type ? SWAP_TYPE_TO_DOMAIN[_type] : SwapType.Unknown;

        if (idempotency) {
            await IdempotencyService.checkAndThrowIfIdempotencyConflict(
                idempotency
            );
        }

        const start = Date.now();

        const response = await solana.submitAndWait(
            blockHeight,
            rawTransaction
        );

        const end = Date.now();

        console.log(`[took ${end - start}ms to submit transaction]`);
        console.log(`[submit transaction successful: ${response.isSuccess()}]`);

        const chain = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_chain];

        if (response.isFailure()) {
            // this throws an error
            await _handleAndThrowError(user.id, chain, response.error);
        }

        const { durationMS, signature } = response.value;

        Datadog.increment("api.submit_transaction.ok", 1, { chain });
        Datadog.histogram("api.submit_transaction.duration", durationMS, {
            chain,
            type: "ok",
        });

        // silent
        const swapEventResponse = await swapEventRepo.create({
            status: SwapStatus.Processed,
            chain: ACCOUNT_PROVIDER_GQL_TO_DOMAIN[chain],
            hash: signature,
            isTimedOut: false,
            durationSeconds: parseFloat((durationMS / 1000).toFixed(3)),
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.id,
        });

        const swapResponse = await _createSwap(
            user,
            args.quoteId,
            signature,
            privacy ? SWAP_PRIVACY_TO_DOMAIN[privacy] : null,
            type
        );

        if (swapResponse.isFailure()) {
            // log to slack, urgent error bc the txn did go through
            await Slack.send({
                channel: SlackChannel.TradingNever,
                message: [
                    `❌ Error creating swap after successful txn submission: ${swapResponse.error.message}`,
                    `Signature: ${signature}`,
                    `User: ${user.email} (${user.id})`,
                ].join("\n"),
            });

            throwIfErrorAndDatadog(swapResponse, {
                datadogMetric: "api.submit_transaction.err",
            });
        }

        // depending on response, etc...
        return {
            signature,
            swapId: swapResponse.value,
        };
    },
});

const _handleAndThrowError = async (
    userId: string,
    chain: AccountProvider,
    error: SolanaError
) => {
    // if it is a timeout
    const isTimedOut = error.type === "timeout";
    const duration = error.durationMs;

    Datadog.increment("api.submit_transaction.err", 1, { chain });
    Datadog.histogram("api.submit_transaction.duration", duration, {
        chain,
        type: "err",
    });

    if (isTimedOut) {
        Datadog.increment("api.submit_transaction.timeout", 1, { chain });
    }

    const swapEventResponse = await swapEventRepo.create({
        status: SwapStatus.Failed,
        chain: ACCOUNT_PROVIDER_GQL_TO_DOMAIN[chain],
        hash: null,
        isTimedOut,
        durationSeconds: parseFloat((duration / 1000).toFixed(3)),
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
    });

    throwIfError(swapEventResponse);

    const userResponse = await pgUserRepo.findById(userId);
    const email = userResponse.isFailure() ? "" : userResponse.value.email;

    void Slack.send({
        channel: SlackChannel.Traders,
        message: [
            `❌ Swap failed for user ${email} (${userId}) on ${chain}`,
            `Error: ${error.message}`,
            `Duration: ${duration}ms`,
        ].join("\n"),
    });

    throw new ApolloError(error.message, "400");
};

const _createSwap = async (
    user: User,
    quoteId: string,
    hash: string,
    privacy: Maybe<SwapPrivacy>,
    type: SwapType
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    try {
        const quoteResponse = await quoteRepo.findById(quoteId);

        if (quoteResponse.isFailure()) {
            return failure(quoteResponse.error);
        }

        const quote = quoteResponse.value;

        // FIXME: these are estimates -> have to look at the onchain txn to get the actual values
        const swapResponse = await swapRepo.create({
            status: SwapStatus.Pending,
            failedReason: null,
            quoteId: quote.id,
            estimatedPnLFiatAmountCents: null,
            estimatedFeeFiatAmountCents: quote.estimatedFeeValueCents,
            sendSymbol: quote.sendSymbol,
            receiveSymbol: quote.receiveSymbol,
            sendIconImageUrl: quote.sendIconImageUrl,
            receiveIconImageUrl: quote.receiveIconImageUrl,
            sendAmount: quote.sendAmount,
            receiveAmount: quote.receiveAmount,
            receiveTokenContractAddress: quote.receiveTokenContractAddress,
            sendTokenContractAddress: quote.sendTokenContractAddress,
            hash,
            type,
            id: uuidv4(),
            provider: quote.provider,
            chain: quote.chain,
            userId: user.id,
            estimatedSwapFiatAmountCents: quote.estimatedSwapFiatAmountCents,
            privacy: privacy ?? DEFAULT_SWAP_PRIVACY,
            finalizedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        throwIfError(swapResponse);

        const swap = swapResponse.value;

        await Slack.send({
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

        await AnalyticsService.track({
            userId: user.id,
            eventName: EventName.SwapCreated,
            properties: {
                chain: swap.chain,
                send_token: swap.sendSymbol,
                receive_token: swap.receiveSymbol,
                amount_usd: swap.estimatedSwapFiatAmountCents,
            },
        });

        return success(swap.id);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};
