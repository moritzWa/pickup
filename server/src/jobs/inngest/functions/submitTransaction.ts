import { Tags } from "hot-shots";
import { DefaultErrors, failure, FailureOrSuccess } from "src/core/logic";
import { Datadog, helius, jito } from "src/utils";
import { Slack, SlackChannel } from "src/utils/slack";
import { trackError } from "src/utils/trackDatadog";
import { inngest } from "../clients";
import { InngestEventName, SubmitTransactionData } from "../types";
import { NonRetriableError, slugify } from "inngest";
import { config } from "src/config";
import { SyncTransactionsService } from "src/modules/transactions/services";
import { MagicPortfolioService } from "src/modules/portfolio/services/portfolioService/magicPortfolioService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { solana, SolanaError } from "src/utils/solana";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { SwapStatus, SwapType } from "src/core/infra/postgres/entities/Trading";
import {
    swapEventRepo,
    swapFeeRepo,
    swapRepo,
} from "src/modules/trading/infra/postgres";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { v4 as uuidv4 } from "uuid";
import { pusher, PusherEventName } from "src/utils/pusher";
import { SwapStatusService } from "src/modules/trading/services/swapService/swapStatusService";
import { referralCommissionRepo } from "src/modules/referral/infra";
import base58 = require("bs58");
import {
    NotificationService,
    SendNotificationParams,
} from "src/modules/notifications/services/notificationService";
import { ProfileService } from "src/modules/profile/services";
import { chunk } from "lodash";
import { sleep } from "radash";

const NAME = "Submit Transaction";
const RETRIES = 5;

const submitTransaction = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: {
            limit: 5,
            key: "event.data.userId",
        },
        retries: RETRIES,
    },
    { event: InngestEventName.SubmitTransaction },
    async ({ event, step, runId }) => {
        console.info(`[syncing swap ${runId}]`);

        const data = event.data;

        await step.run("submit", () => _submit(data));

        await step.run("sync-swap-transaction", () =>
            _syncSwapTransaction(data.swapId)
        );

        await step.run("update-portfolio", () => _updatePortfolio(data.userId));

        // sleep 15 seconds
        await step.sleep("wait-for-processing", "15s");

        await step.run("sync-swap-if-pending", () =>
            _syncSwapIfPending(data.swapId)
        );

        await step.run("notify-followers", () => _notifyFollowers(data.swapId));
    }
);

const _submit = async (data: SubmitTransactionData) => {
    if (data.chain === AccountProvider.Solana) {
        const hash = await helius.blocks.current();

        // fire it off to jito if we can again
        if (hash.isSuccess() && hash.value.blockhash) {
            void jito.bundles.sendWithRetry(
                [base58.decode(data.rawTransaction)],
                hash.value.blockhash
            );
        }

        const response = await solana.resSubmitAndWait(
            data.blockHeight,
            data.signature,
            data.rawTransaction
        );

        if (response.isFailure()) {
            console.log(`[failed to submit transaction: ${response.error}]`);
            return _handleAndThrowError(
                data.userId,
                data.swapId,
                data.chain,
                response.error
            );
        }

        console.log(
            `[submitted transaction: ${response.value.signature} (${response.value.durationMS})]`
        );

        const { signature, durationMS } = response.value;

        // make the event
        await swapEventRepo.create({
            status: SwapStatus.Processed,
            chain: data.chain,
            hash: signature,
            isTimedOut: false,
            durationSeconds: durationMS,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: data.userId,
        });

        // TODO: this is ot true, need to actually sync the status

        const swapResponse = await swapRepo.findById(data.swapId);

        if (swapResponse.isFailure()) {
            throw swapResponse.error;
        }

        await SwapStatusService.syncStatus(swapResponse.value);

        // pusher event
        await pusher.trigger(
            `users-${data.userId}`,
            PusherEventName.TradeUpdate,
            {
                type: "confirmed",
            }
        );

        Datadog.increment("inngest.submit_transaction.ok", 1);
    }

    return Promise.resolve();
};

const _handleAndThrowError = async (
    userId: string,
    swapId: string,
    chain: AccountProvider,
    error: SolanaError
) => {
    // if it is a timeout
    const isTimedOut = error.type === "timeout";

    Datadog.increment("inngest.submit_transaction.err", 1, { chain });

    const swapResponse = await swapRepo.findById(swapId);
    const userResponse = await pgUserRepo.findById(userId);

    if (swapResponse.isFailure()) {
        throw new NonRetriableError("Swap not found.");
    }

    const swap = swapResponse.value;
    const createdAt = swap.createdAt;
    const now = new Date();
    const durationMs = now.getTime() - createdAt.getTime();

    if (swap.status === SwapStatus.Failed) {
        // if not failed reason -> try to fill it in
        if (!swap.failedReason) {
            const failedReason = await solana.getFailedReason(swap.hash);

            // update the swap to failed
            await swapRepo.update(swapId, {
                failedReason,
            });

            await pusher.trigger(
                `users-${userId}`,
                PusherEventName.TradeUpdate
            );
        }

        throw new NonRetriableError("Swap already failed.");
    }

    Datadog.histogram("inngest.submit_transaction.duration", durationMs, {
        chain,
        type: "err",
    });

    const failedReason = await solana.getFailedReason(swap.hash);

    // update the swap to failed
    await swapRepo.update(swapId, {
        status: SwapStatus.Failed,
        failedReason,
    });

    await referralCommissionRepo.deleteForSwap(swapId);
    await swapFeeRepo.deleteForSwap(swapId);

    await pusher.trigger(`users-${userId}`, PusherEventName.TradeUpdate);

    if (isTimedOut) {
        Datadog.increment("inngest.submit_transaction.timeout", 1, { chain });
    }

    await swapEventRepo.create({
        status: SwapStatus.Failed,
        chain: ACCOUNT_PROVIDER_GQL_TO_DOMAIN[chain],
        hash: null,
        isTimedOut,
        durationSeconds: durationMs,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
    });

    // throwIfError(swapEventResponse);
    const email = userResponse.isFailure() ? "" : userResponse.value.email;

    void Slack.send({
        channel: SlackChannel.Swaps,
        format: true,
        message: [
            `❌ Failed to submit trade for user ${email} (${userId}) on ${chain}`,
            `Error: ${error.message}`,
            `Signature: ${swap.hash}`,
            `Duration: ${durationMs}ms`,
        ].join("\n"),
    });

    await pusher.trigger(`users-${userId}`, PusherEventName.TradeUpdate, {
        type: "failed",
    });

    throw new NonRetriableError("Timed out.");
};

const _syncSwapTransaction = async (swapId: string) => {
    const swapResponse = await swapRepo.findById(swapId);

    if (swapResponse.isFailure()) {
        throw swapResponse.error;
    }

    const swap = swapResponse.value;

    const response = await SyncTransactionsService.syncTransactionForSwap(
        swap.id
    );

    if (response.isFailure()) {
        throw response.error;
    }

    await SwapStatusService.syncStatus(swap); // try and sync the txn

    return Promise.resolve();
};

const _updatePortfolio = async (userId: string) => {
    const userResponse = await pgUserRepo.findById(userId);

    if (userResponse.isFailure()) {
        throw userResponse.error;
    }

    const user = userResponse.value;

    await MagicPortfolioService.getFullPositionsFromMagicAndSetCache(user);

    return Promise.resolve();
};

const _syncSwapIfPending = async (swapId: string) => {
    const swapResponse = await swapRepo.findById(swapId);

    if (swapResponse.isFailure()) {
        throw new NonRetriableError("Swap not found.");
    }

    const swap = swapResponse.value;

    if (swap.status !== SwapStatus.Pending) {
        console.log(
            `[swap ${swap.id} is not pending, skipping sync: ${swap.status}]`
        );
        return Promise.resolve();
    }

    console.log(`[swap ${swap.id} needs to be synced]`);

    await SwapStatusService.syncStatus(swap); // try and sync the txn

    return Promise.resolve();
};

const _notifyFollowers = async (swapId: string) => {
    const swapResponse = await swapRepo.findById(swapId);

    if (swapResponse.isFailure()) {
        throw swapResponse.error;
    }

    const swap = swapResponse.value;

    if (!swap.userId) {
        return Promise.resolve();
    }

    if (swap.type === SwapType.Buy) {
        await inngest.send({
            name: InngestEventName.SendBuyNotifications,
            data: { swapId: swap.id, userId: swap.userId },
        });
    }

    return Promise.resolve();
};

export default submitTransaction;
