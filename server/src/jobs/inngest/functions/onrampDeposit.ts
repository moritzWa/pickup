import { inngest } from "../clients";
import { InngestEventName } from "../types";
import { NonRetriableError, slugify } from "inngest";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { NotFoundError } from "src/core/logic";
import { solana } from "src/utils/solana";
import { Datadog, Slack, SlackChannel, formatNum, helius } from "src/utils";
import {
    AccountProvider,
    TransactionStatus,
} from "src/core/infra/postgres/entities";
import { UserNotificationService } from "src/modules/users/services/userNotificationService";
import { NotificationService } from "src/modules/notifications/services/notificationService";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";
import { SOL_USDC_MINT } from "src/shared/integrations/providers/solana/constants";
import base58 = require("bs58");
import { depositRepo } from "src/modules/transfers/infra/postgres";

// if you change this also checkout canWithdraw bc it assumes it is usdc
// also you have to change stuff on the frontend too
const DEFAULT_MINT = SOL_USDC_MINT;
const DEFAULT_TOKEN_SYMBOL = "USDC";
const DEFAULT_TOKEN_ICON_IMAGE_URL =
    "https://assets.movement.market/coins/usdc.png";

const NAME = "Onramp Deposit";
const RETRIES = 5;

const onrampDeposit = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: {
            limit: 1,
            key: "event.data.id",
        },
        retries: RETRIES,
        onFailure: async ({ event, runId, error }) => {
            console.log(`[onramp deposit failed ${runId}]`);
            console.log(error);

            Datadog.increment("inngest.onramp_deposit.err");
        },
    },
    { event: InngestEventName.OnrampDeposit },
    async ({ event, step, runId }) => {
        console.info(`[onramp deposit ${runId}]`);

        const depositTxn = await step.run(
            "build-user-init-deposit-transaction",
            () => _buildDepositTransaction(event.data.depositId)
        );

        await step.run("submit-deposit-transaction", () =>
            _submitTransaction(event.data.depositId, depositTxn)
        );

        await step.run("send-deposit-notifications", () =>
            _sendNotifications(event.data.depositId)
        );
    }
);

const _buildDepositTransaction = async (
    depositId: string
): Promise<{
    rawTransaction: string;
    blockhash: string;
}> => {
    // lock this specific airdrop for at least 5 minutes so we can guarantee it succeeds or fails

    const depositResponse = await depositRepo.findById(depositId, {
        relations: { user: true },
    });

    if (depositResponse.isFailure()) {
        if (depositResponse.error instanceof NotFoundError) {
            throw new NonRetriableError("Deposit not found.");
        }

        throw depositResponse.error;
    }

    const deposit = depositResponse.value;
    const user = deposit.user;

    if (deposit.hasSentFunds) {
        throw new NonRetriableError("Deposit already on-ramped.");
    }

    const walletPubKey = user.wallets?.find(
        (w) => w.provider === AccountProvider.Solana
    )?.publicKey;

    if (!walletPubKey) {
        // log to slack
        void Slack.send({
            format: true,
            channel: SlackChannel.TradingUrgent,
            message: [
                `User does not have a Solana wallet 🚨`,
                `Deposit ID: ${deposit.id}`,
                `User ID: ${user.id}`,
            ].join("\n"),
        });

        throw new NonRetriableError(
            "User does not have a Solana wallet so on-ramped deposit failed."
        );
    }

    const feePayerKeypair = solana.getMovementFeePayerKeypair();
    const fundAccountKeypair = solana.getMovementOnrampKeypair();

    if (!feePayerKeypair || !fundAccountKeypair) {
        void Slack.send({
            format: true,
            channel: SlackChannel.TradingUrgent,
            message: [
                `Could not get fee payer or fund account 🚨`,
                `Deposit ID: ${deposit.id}`,
                `User ID: ${user.id}`,
            ].join("\n"),
        });

        throw new NonRetriableError("Could not get fee payer or fund account.");
    }

    const response = await solana.buildDepositTransaction({
        mintAddress: DEFAULT_MINT,
        amount: deposit.amount.toNumber(),
        walletPubKey,
        feePayerKeypair,
        fundAccountKeypair,
    });

    if (response.isFailure()) {
        void Slack.send({
            channel: SlackChannel.TradingUrgent,
            format: true,
            message: [
                `Initial Deposit Claim Failed 🚨`,
                `Deposit: ${deposit.id}`,
                `User ID: ${user.id} (${user.email})`,
            ].join("\n"),
        });

        throw response.error;
    }

    const { txn, blockhash } = response.value;
    const rawTransaction = base58.encode(txn.serialize());

    return {
        rawTransaction,
        blockhash,
    };
};

const _submitTransaction = async (
    depositId: string,
    claimTxn: {
        rawTransaction: string;
        blockhash: string;
    }
): Promise<any> => {
    const depositResponse = await depositRepo.findById(depositId, {
        relations: { user: true },
    });

    if (depositResponse.isFailure()) {
        if (depositResponse.error instanceof NotFoundError) {
            throw new NonRetriableError("Deposit not found.");
        }

        throw depositResponse.error;
    }

    const deposit = depositResponse.value;
    const user = deposit.user;

    if (deposit.hasSentFunds) {
        throw new NonRetriableError("Deposit already on-ramped.");
    }

    // update deposit
    const updatedResponse = await depositRepo.update(depositId, {
        hasSentFunds: true,
    });

    if (updatedResponse.isFailure()) {
        throw updatedResponse.error;
    }

    const response = await solana.submitInitial(
        claimTxn.rawTransaction,
        claimTxn.blockhash,
        true
    );

    if (response.isFailure()) {
        void Slack.send({
            channel: SlackChannel.TradingUrgent,
            format: true,
            message: [
                `Initial Deposit Claim Failed 🚨`,
                `Deposit ID: ${deposit.id}`,
                `User ID: ${user.id} (${user.email})`,
            ].join("\n"),
        });

        throw response.error;
    }

    // if sent initial goes through, just update the airdrop status to success for now
    // so cannot claim it again
    const signature = response.value;

    console.log(`[initial deposit for ${signature}]`);

    void Slack.send({
        channel: SlackChannel.Onramps,
        format: true,
        message: [
            `Deposit Succeeded 💸`,
            `Deposit ID: ${depositId}`,
            `Hash: ${signature}`,
            `Link: ${
                BlockExplorerService.getBlockExplorerInfo(
                    AccountProvider.Solana,
                    signature
                )?.url || ""
            }`,
            `User ID: ${user.id} (${user.email})`,
        ].join("\n"),
    });

    const statusResponse = await helius.transactions.isReceived(signature);

    const updatedDepositResponse = await depositRepo.update(deposit.id, {
        transactionHash: signature,
    });

    if (updatedDepositResponse.isFailure()) {
        void Slack.send({
            channel: SlackChannel.TradingUrgent,
            message: [
                `Onramp Failed 🚨`,
                `Deposit: ${deposit.id}`,
                `Hash: ${signature} (${
                    BlockExplorerService.getBlockExplorerInfo(
                        AccountProvider.Solana,
                        signature
                    )?.url || ""
                })`,
                `User ID: ${user.id} (${user.email})`,
            ].join("\n"),
        });

        throw updatedDepositResponse.error;
    }

    return Promise.resolve();
};

const _sendNotifications = async (depositId: string) => {
    const depositResponse = await depositRepo.findById(depositId, {
        relations: { user: true },
    });

    if (depositResponse.isFailure()) {
        if (depositResponse.error instanceof NotFoundError) {
            throw new NonRetriableError("Deposit not found.");
        }

        throw depositResponse.error;
    }

    const deposit = depositResponse.value;
    const user = deposit.user;

    await NotificationService.sendNotification(user, {
        title: `Deposit Succeeded`,
        subtitle: `You received ${formatNum(
            deposit.amount.toNumber() ?? 0
        )} USDC!`,
        iconImageUrl: DEFAULT_TOKEN_ICON_IMAGE_URL,
        followerUserId: null,
    });

    Datadog.increment("inngest.onramp_deposit.ok");

    return Promise.resolve();
};

export default onrampDeposit;
