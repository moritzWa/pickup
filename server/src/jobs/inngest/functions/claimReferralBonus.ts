import { inngest } from "../clients";
import { InngestEventName } from "../types";
import { NonRetriableError, slugify } from "inngest";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { NotFoundError, failure, success } from "src/core/logic";
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
import { referralRepo } from "src/modules/referral/infra";
import {
    DEFAULT_REFERRAL_AMOUNT_USDC,
    DEFAULT_REFERRAL_USDC_ICON_IMAGE_URL,
    DEFAULT_REFERRAL_USDC_MINT,
} from "src/core/infra/postgres/entities/Referrals/Referral";

const NAME = "Claim Referral Bonus";
const RETRIES = 5;

const claimReferralBonus = inngest.createFunction(
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
    { event: InngestEventName.ClaimReferralBonus },
    async ({ event, step, runId }) => {
        console.info(`[claiming referral bonus ${runId}]`);

        const bonusTxn = await step.run(
            "build-referral-bonus-transaction",
            () => _buildDepositTransaction(event.data.referralId)
        );

        await step.run("submit-referral-transaction", () =>
            _submitTransaction(event.data.referralId, bonusTxn)
        );

        await step.run("send-referral-notifications", () =>
            _sendNotifications(event.data.referralId)
        );
    }
);

const _buildDepositTransaction = async (
    referralId: string
): Promise<{
    rawTransaction: string;
    blockhash: string;
}> => {
    // lock this specific airdrop for at least 5 minutes so we can guarantee it succeeds or fails

    const referralResponse = await referralRepo.findById(referralId);

    if (referralResponse.isFailure()) {
        throw referralResponse.error;
    }

    const referral = referralResponse.value;

    const rewardedUserId = referral.referredUserId;
    const userResponse = await pgUserRepo.findById(rewardedUserId);

    if (userResponse.isFailure()) {
        if (userResponse.error instanceof NotFoundError) {
            throw new NonRetriableError("User not found.");
        }

        throw userResponse.error;
    }

    const user = userResponse.value;

    if (referral.hasClaimedReward) {
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
                `User ID: ${user.id}`,
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
                `User ID: ${user.id}`,
            ].join("\n"),
        });

        throw new NonRetriableError("Could not get fee payer or fund account.");
    }

    const mintAddress =
        referral.rewardTokenContractAddress ?? DEFAULT_REFERRAL_USDC_MINT;
    const amount = referral.rewardAmount ?? DEFAULT_REFERRAL_AMOUNT_USDC;

    const response = await solana.buildDepositTransaction({
        mintAddress,
        amount,
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
    referralId: string,
    claimTxn: {
        rawTransaction: string;
        blockhash: string;
    }
): Promise<any> => {
    return Promise.resolve();
    // don't send anything
    // const referralResponse = await referralRepo.findById(referralId, {
    //     relations: {
    //         referredByUser: true,
    //         referredUser: true,
    //     },
    // });

    // if (referralResponse.isFailure()) {
    //     throw referralResponse.error;
    // }

    // const referral = referralResponse.value;
    // const referredUser = referral.referredUser;
    // const referredByUser = referral.referredByUser;

    // if (referral.hasClaimedReward) {
    //     throw new NonRetriableError("Referral already claimed.");
    // }

    // const response = await solana.submitInitial(
    //     claimTxn.rawTransaction,
    //     claimTxn.blockhash
    // );

    // if (response.isFailure()) {
    //     void Slack.send({
    //         channel: SlackChannel.TradingUrgent,
    //         format: true,
    //         message: [
    //             `Referral Bonus Failed 🚨`,
    //             `Referred User: ${referredUser.id} (${referredUser.email})`,
    //         ].join("\n"),
    //     });

    //     throw response.error;
    // }

    // // if sent initial goes through, just update the airdrop status to success for now
    // // so cannot claim it again
    // const signature = response.value;

    // console.log(`[referral bonnus for ${signature}]`);

    // void Slack.send({
    //     channel: SlackChannel.ReferralBonus,
    //     format: true,
    //     message: [
    //         `Referral Bonus Succeeded 💸`,
    //         `Hash: ${signature}`,
    //         `Link: ${
    //             BlockExplorerService.getBlockExplorerInfo(
    //                 AccountProvider.Solana,
    //                 signature
    //             )?.url || ""
    //         }`,
    //         `Referral ID: ${referral.id}`,
    //         `Referred By: ${referredByUser.name} (${referredByUser.email})`,
    //     ].join("\n"),
    // });

    // const statusResponse = await helius.transactions.isReceived(signature);

    // const updatedRefResponse = await referralRepo.update(referral.id, {
    //     isDepositSuccessful: statusResponse.isSuccess(),
    //     rewardTransactionHash: signature,
    // });

    // if (updatedRefResponse.isFailure()) {
    //     void Slack.send({
    //         channel: SlackChannel.TradingUrgent,
    //         message: [
    //             `Referral Bonus Failed but transaction was submitted 🚨`,
    //             `Hash: ${signature} (${
    //                 BlockExplorerService.getBlockExplorerInfo(
    //                     AccountProvider.Solana,
    //                     signature
    //                 )?.url || ""
    //             })`,
    //             `Referral ID: ${referral.id}`,
    //         ].join("\n"),
    //     });

    //     throw updatedRefResponse.error;
    // }

    // return Promise.resolve();
};

const _sendNotifications = async (referralId: string) => {
    const refResponse = await referralRepo.findById(referralId, {
        relations: {
            referredByUser: true,
            referredUser: true,
        },
    });

    if (refResponse.isFailure()) {
        throw refResponse.error;
    }

    const ref = refResponse.value;
    const referredUser = ref.referredUser;
    const referredByUser = ref.referredByUser;

    await NotificationService.sendNotification(referredUser, {
        title: `Referral Bonus`,
        subtitle: `You received ${formatNum(ref.rewardAmount ?? 0)} ${
            ref.rewardTokenSymbol ?? "crypto"
        }!`,
        iconImageUrl: DEFAULT_REFERRAL_USDC_ICON_IMAGE_URL,
        followerUserId: null,
    });

    await NotificationService.sendNotification(referredByUser, {
        title: `Referral`,
        subtitle: `${referredUser.username} signed up with your code!`,
        iconImageUrl: DEFAULT_REFERRAL_USDC_ICON_IMAGE_URL,
        followerUserId: null,
    });

    Datadog.increment("inngest.claim_referral_bonus.ok");

    return Promise.resolve();
};

export default claimReferralBonus;
