import { Tags } from "hot-shots";
import { DefaultErrors, failure, FailureOrSuccess } from "src/core/logic";
import { Datadog } from "src/utils";
import { Slack, SlackChannel } from "src/utils/slack";
import { trackError } from "src/utils/trackDatadog";
import { inngest } from "../clients";
import {
    InngestEventName,
    SubmitTransactionData,
    SubmitWithdrawalData,
} from "../types";
import { NonRetriableError, slugify } from "inngest";
import { config } from "src/config";
import { SyncTransactionsService } from "src/modules/transactions/services";
import { MagicPortfolioService } from "src/modules/portfolio/services/portfolioService/magicPortfolioService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { solana, SolanaError } from "src/utils/solana";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { v4 as uuidv4 } from "uuid";
import { pusher, PusherEventName } from "src/utils/pusher";
import { referralCommissionRepo } from "src/modules/referral/infra";
import { withdrawalRepo } from "src/modules/transfers/infra";
import { WithdrawalStatus } from "src/core/infra/postgres/entities/Withdrawal";
import { WithdrawalStatusService } from "src/modules/transfers/services/syncWithdrawalService";

const NAME = "Submit Withdrawal";
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
    { event: InngestEventName.SubmitWithdrawal },
    async ({ event, step, runId }) => {
        console.info(`[syncing withdrawal ${runId}]`);

        const data = event.data;

        await step.run("submit", () => _submit(data));

        await step.run("sync-withdrawal-transaction", () =>
            _syncTransaction(data.withdrawalId)
        );

        await step.run("update-portfolio", () => _updatePortfolio(data.userId));

        // sleep 15 seconds
        await step.sleep("wait-for-processing", "15s");

        await step.run("sync-withdrawal-if-pending", () =>
            _syncTransaction(data.withdrawalId)
        );
    }
);

const _submit = async (data: SubmitWithdrawalData) => {
    if (data.chain === AccountProvider.Solana) {
        const response = await solana.resSubmitAndWait(
            data.blockHeight,
            data.signature,
            data.rawTransaction
        );

        if (response.isFailure()) {
            console.log(`[failed to submit transaction: ${response.error}]`);
            return _handleAndThrowError(
                data.userId,
                data.withdrawalId,
                data.chain,
                response.error
            );
        }

        console.log(
            `[submitted transaction: ${response.value.signature} (${response.value.durationMS})]`
        );

        const { signature, durationMS } = response.value;

        const withdrawalResponse = await withdrawalRepo.findById(
            data.withdrawalId
        );

        if (withdrawalResponse.isFailure()) {
            throw withdrawalResponse.error;
        }

        await WithdrawalStatusService.syncStatus(withdrawalResponse.value);

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
    withdrawalId: string,
    chain: AccountProvider,
    error: SolanaError
) => {
    // if it is a timeout
    const isTimedOut = error.type === "timeout";

    Datadog.increment("inngest.submit_transaction.err", 1, { chain });

    const withdrawalResponse = await withdrawalRepo.findById(withdrawalId);
    const userResponse = await pgUserRepo.findById(userId);

    if (withdrawalResponse.isFailure()) {
        throw new NonRetriableError("Withdrawal not found.");
    }

    const withdrawal = withdrawalResponse.value;
    const createdAt = withdrawal.createdAt;
    const now = new Date();
    const durationMs = now.getTime() - createdAt.getTime();

    if (!withdrawal.hash) {
        throw new Error("Withdrawal hash not set.");
    }

    if (withdrawal.status === WithdrawalStatus.Failed) {
        // if not failed reason -> try to fill it in
        if (!withdrawal.failedReason) {
            const failedReason = await solana.getFailedReason(withdrawal.hash);

            // update the withdrawal to failed
            await withdrawalRepo.update(withdrawalId, {
                failedReason,
            });

            await pusher.trigger(
                `users-${userId}`,
                PusherEventName.TradeUpdate
            );
        }

        throw new NonRetriableError("Withdrawal already failed.");
    }

    Datadog.histogram("inngest.submit_transaction.duration", durationMs, {
        chain,
        type: "err",
    });

    const failedReason = await solana.getFailedReason(withdrawal.hash);

    // update the withdrawal to failed
    await withdrawalRepo.update(withdrawalId, {
        status: WithdrawalStatus.Failed,
        failedReason,
    });

    await pusher.trigger(`users-${userId}`, PusherEventName.TradeUpdate);

    if (isTimedOut) {
        Datadog.increment("inngest.submit_transaction.timeout", 1, { chain });
    }

    // throwIfError(withdrawalEventResponse);
    const email = userResponse.isSuccess() ? userResponse.value.email : "n/a";

    void Slack.send({
        channel: SlackChannel.TradingUrgent,
        format: true,
        message: [
            `❌ Failed to submit withdrawal`,
            `Error: ${error.message}`,
            `Signature: ${withdrawal.hash}`,
            `User: ${email} (${userId})`,
            `Duration: ${durationMs}ms`,
        ].join("\n"),
    });

    await pusher.trigger(`users-${userId}`, PusherEventName.TradeUpdate, {
        type: "failed",
    });

    throw new NonRetriableError("Timed out.");
};

const _syncTransaction = async (withdrawalId: string) => {
    const withdrawalResponse = await withdrawalRepo.findById(withdrawalId);

    if (withdrawalResponse.isFailure()) {
        throw withdrawalResponse.error;
    }

    const withdrawal = withdrawalResponse.value;

    const response = await SyncTransactionsService.syncTransactionForWithdrawal(
        withdrawal.id
    );

    if (response.isFailure()) {
        throw response.error;
    }

    await WithdrawalStatusService.syncStatus(withdrawal); // try and sync the txn

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

export default submitTransaction;
