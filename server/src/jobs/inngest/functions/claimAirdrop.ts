import { inngest } from "../clients";
import { InngestEventName } from "../types";
import { NonRetriableError, slugify } from "inngest";
import { config } from "src/config";
import { SyncTransactionsService } from "src/modules/transactions/services";
import { MagicPortfolioService } from "src/modules/portfolio/services/portfolioService/magicPortfolioService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { acquireLock, redlock } from "src/utils/redlock";
import { airdropClaimRepo } from "src/modules/airdrops/infra/postgres";
import { NotFoundError } from "src/core/logic";
import { AirdropClaimStatus } from "src/core/infra/postgres/entities/Airdrop";
import { solana } from "src/utils/solana";
import { AirdropClaimService } from "src/modules/airdrops/services/airdropClaimService";
import { Slack, SlackChannel, formatNum, helius } from "src/utils";
import { TransactionStatus } from "src/core/infra/postgres/entities";
import { UserNotificationService } from "src/modules/users/services/userNotificationService";
import { NotificationService } from "src/modules/notifications/services/notificationService";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";

const NAME = "Claim Airdrop";
const RETRIES = 5;

const claimAirdrop = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: {
            limit: 1,
            key: "event.data.id",
        },
        retries: RETRIES,
    },
    { event: InngestEventName.ClaimAirdrop },
    async ({ event, step, runId }) => {
        console.info(`[claiming airdrop ${runId}]`);

        const claimAirdropTxn = await step.run(
            "build-airdrop-claim-transaction",
            () => _buildAirdropTransaction(event.data.airdropClaimId)
        );

        await step.run("submit-airdrop-transaction", () =>
            _submitTransaction(event.data.airdropClaimId, claimAirdropTxn)
        );

        await step.run("send-airdrop-notifications", () =>
            _sendNotifications(event.data.airdropClaimId)
        );
    }
);

const _buildAirdropTransaction = async (
    airdropClaimId: string
): Promise<{
    rawTransaction: string;
    blockhash: string;
}> => {
    // lock this specific airdrop for at least 5 minutes so we can guarantee it succeeds or fails

    // const lockResponse = await acquireLock(
    //     redlock,
    //     [airdropClaimId],
    //     5 * 60 * 1000
    // );

    // if (lockResponse.isFailure()) {
    //     throw lockResponse.error;
    // }

    const claimResponse = await airdropClaimRepo.findById(airdropClaimId);

    if (claimResponse.isFailure()) {
        if (claimResponse.error instanceof NotFoundError) {
            throw new NonRetriableError("Claim not found.");
        }

        throw claimResponse.error;
    }

    const claim = claimResponse.value;

    if (claim.status === AirdropClaimStatus.Succeeded) {
        throw new NonRetriableError("Claim already succeeded.");
    }

    const response = await AirdropClaimService.buildAirdropTransaction(claim);

    if (response.isFailure()) {
        throw response.error;
    }

    return response.value;
};

const _submitTransaction = async (
    claimId: string,
    claimTxn: {
        rawTransaction: string;
        blockhash: string;
    }
): Promise<any> => {
    const checkClaimResponse = await airdropClaimRepo.findById(claimId);

    if (checkClaimResponse.isFailure()) {
        throw checkClaimResponse.error;
    }

    const checkClaim = checkClaimResponse.value;

    if (checkClaim.status === AirdropClaimStatus.Succeeded) {
        throw new NonRetriableError("Claim already succeeded.");
    }

    // lock this specific airdrop for at least 5 minutes so we can guarantee it succeeds or fails

    const response = await solana.submitInitial(
        claimTxn.rawTransaction,
        claimTxn.blockhash,
        true
    );

    if (response.isFailure()) {
        void Slack.send({
            channel: SlackChannel.Airdrops,
            message: [`Airdrop Claim Failed 🚨`, `Claim ID: ${claimId}`].join(
                "\n"
            ),
        });

        throw response.error;
    }

    // if sent initial goes through, just update the airdrop status to success for now
    // so cannot claim it again
    const signature = response.value;

    console.log(`[airdrop for ${signature}]`);

    void Slack.send({
        channel: SlackChannel.Airdrops,
        format: true,
        message: [
            `Airdrop Claim Succeeded 🪂`,
            `Hash: ${signature}`,
            `Link: ${
                BlockExplorerService.getBlockExplorerInfo(
                    checkClaim.chain,
                    signature
                )?.url || ""
            }`,
            `Claim ID: ${claimId}`,
        ].join("\n"),
    });

    const statusResponse = await helius.transactions.isReceived(signature);

    const claimResponse = await airdropClaimRepo.update(claimId, {
        status: AirdropClaimStatus.Succeeded,
        transactionHash: signature,
        submittedAt: new Date(),
        // if success that means it returned -> FIXME: this is basically always going to leave the txn as pending atm
        transactionStatus: statusResponse.isSuccess()
            ? TransactionStatus.Confirmed
            : TransactionStatus.Pending,
    });

    if (claimResponse.isFailure()) {
        void Slack.send({
            channel: SlackChannel.Airdrops,
            message: [
                `Airdrop Claim Failed but transaction was submitted 🚨`,
                `Hash: ${signature} (${
                    BlockExplorerService.getBlockExplorerInfo(
                        checkClaim.chain,
                        signature
                    )?.url || ""
                })`,
                `Claim ID: ${claimId}`,
            ].join("\n"),
        });

        throw claimResponse.error;
    }

    return Promise.resolve();
};

const _sendNotifications = async (claimId: string) => {
    // get the claim with relations inviter and invited users
    const claimResponse = await airdropClaimRepo.findById(claimId, {
        relations: { invited: true, inviter: true, airdrop: true },
    });

    if (claimResponse.isFailure()) {
        throw claimResponse.error;
    }

    const claim = claimResponse.value;
    const inviter = claim.inviter;
    const invited = claim.invited;
    const airdrop = claim.airdrop;

    await NotificationService.sendNotification(inviter, {
        title: `Airdrop Claimed 🪂`,
        subtitle: `You received ${formatNum(claim.inviterAmount)} ${
            claim.airdrop.symbol
        }!`,
        iconImageUrl: airdrop.iconImageUrl,
        followerUserId: null,
    });

    await NotificationService.sendNotification(invited, {
        title: `Airdrop Claimed 🪂`,
        subtitle: `You received ${formatNum(claim.invitedAmount)} ${
            claim.airdrop.symbol
        }!`,
        iconImageUrl: airdrop.iconImageUrl,
        followerUserId: null,
    });

    return Promise.resolve();
};

export default claimAirdrop;
