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

// if you change this also checkout canWithdraw bc it assumes it is usdc
// also you have to change stuff on the frontend too
const DEFAULT_USDC_AMOUNT = 1;
const DEFAULT_MINT = SOL_USDC_MINT;
const DEFAULT_TOKEN_SYMBOL = "USDC";
const DEFAULT_TOKEN_ICON_IMAGE_URL =
    "https://assets.movement.market/coins/usdc.png";

const NAME = "Claim Initial Deposit";
const RETRIES = 5;

const claimInitialDeposit = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: {
            limit: 1,
            key: "event.data.id",
        },
        retries: RETRIES,
        onFailure: async ({ event, runId, error }) => {
            console.log(`[claim initial deposit failed ${runId}]`);
            console.log(error);

            Datadog.increment("inngest.claim_init_deposit.err");
        },
    },
    { event: InngestEventName.ClaimInitialDeposit },
    async ({ event, step, runId }) => {
        console.info(`[claiming initial deposit ${runId}]`);

        const depositTxn = await step.run(
            "build-user-init-deposit-transaction",
            () => _buildDepositTransaction(event.data.userId)
        );

        await step.run("submit-deposit-transaction", () =>
            _submitTransaction(event.data.userId, depositTxn)
        );

        await step.run("send-deposit-notifications", () =>
            _sendNotifications(event.data.userId)
        );
    }
);

const _buildDepositTransaction = async (
    userId: string
): Promise<{
    rawTransaction: string;
    blockhash: string;
}> => {
    // lock this specific airdrop for at least 5 minutes so we can guarantee it succeeds or fails

    const userResponse = await pgUserRepo.findById(userId);

    if (userResponse.isFailure()) {
        if (userResponse.error instanceof NotFoundError) {
            throw new NonRetriableError("User not found.");
        }

        throw userResponse.error;
    }

    const user = userResponse.value;

    if (user.hasClaimedInitialDeposit) {
        throw new NonRetriableError("User already claimed initial deposit.");
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
                `User ID: ${userId}`,
            ].join("\n"),
        });

        throw new NonRetriableError("User does not have a Solana wallet.");
    }

    const feePayerKeypair = solana.getMovementFeePayerKeypair();
    const fundAccountKeypair = solana.getMovementFundAccountKeypair();

    if (!feePayerKeypair || !fundAccountKeypair) {
        void Slack.send({
            format: true,
            channel: SlackChannel.TradingUrgent,
            message: [
                `Could not get fee payer or fund account 🚨`,
                `User ID: ${userId}`,
            ].join("\n"),
        });

        throw new NonRetriableError("Could not get fee payer or fund account.");
    }

    const response = await solana.buildDepositTransaction({
        mintAddress: DEFAULT_MINT,
        amount: DEFAULT_USDC_AMOUNT,
        walletPubKey,
        feePayerKeypair,
        fundAccountKeypair,
    });

    if (response.isFailure()) {
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
    userId: string,
    claimTxn: {
        rawTransaction: string;
        blockhash: string;
    }
): Promise<any> => {
    const userResponse = await pgUserRepo.findById(userId);

    if (userResponse.isFailure()) {
        throw userResponse.error;
    }

    const user = userResponse.value;

    if (user.hasClaimedInitialDeposit) {
        throw new NonRetriableError("User already claimed deposit.");
    }

    // update this first that way if something fails and we re-enter this, the claimed is true
    // so we don't send it again. prevents double spend good ~enof (not perfect tho, we could use locks at some point)
    const updatedResponse = await pgUserRepo.update(userId, {
        hasClaimedInitialDeposit: true,
        initialDepositAmount: DEFAULT_USDC_AMOUNT,
        initialDepositTokenSymbol: DEFAULT_TOKEN_SYMBOL,
        initialDepositClaimedAt: new Date(),
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
                `User ID: ${userId} (${user.email})`,
            ].join("\n"),
        });

        throw response.error;
    }

    // if sent initial goes through, just update the airdrop status to success for now
    // so cannot claim it again
    const signature = response.value;

    console.log(`[initial deposit for ${signature}]`);

    void Slack.send({
        channel: SlackChannel.FreeMoney,
        format: true,
        message: [
            `Funded User Account Succeeded 💸`,
            `Hash: ${signature}`,
            `Link: ${
                BlockExplorerService.getBlockExplorerInfo(
                    AccountProvider.Solana,
                    signature
                )?.url || ""
            }`,
            `User ID: ${userId} (${user.email})`,
        ].join("\n"),
    });

    const statusResponse = await helius.transactions.isReceived(signature);

    const updatedUserResponse = await pgUserRepo.update(userId, {
        isInitialDepositSuccessful: statusResponse.isSuccess(),
        initialDepositTransactionHash: signature,
    });

    if (updatedUserResponse.isFailure()) {
        void Slack.send({
            channel: SlackChannel.TradingUrgent,
            message: [
                `Airdrop Claim Failed but transaction was submitted 🚨`,
                `Hash: ${signature} (${
                    BlockExplorerService.getBlockExplorerInfo(
                        AccountProvider.Solana,
                        signature
                    )?.url || ""
                })`,
                `User ID: ${userId} (${user.email})`,
            ].join("\n"),
        });

        throw updatedUserResponse.error;
    }

    return Promise.resolve();
};

const _sendNotifications = async (userId: string) => {
    const userResponse = await pgUserRepo.findById(userId);

    if (userResponse.isFailure()) {
        throw userResponse.error;
    }

    const user = userResponse.value;

    await NotificationService.sendNotification(user, {
        title: `Deposit Claimed`,
        subtitle: `You received ${formatNum(user.initialDepositAmount ?? 0)} ${
            user.initialDepositTokenSymbol ?? "crypto"
        }!`,
        iconImageUrl: DEFAULT_TOKEN_ICON_IMAGE_URL,
        followerUserId: null,
    });

    Datadog.increment("inngest.claim_init_deposit.ok");

    return Promise.resolve();
};

export default claimInitialDeposit;
