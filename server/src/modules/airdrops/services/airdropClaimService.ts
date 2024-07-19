import BigNumber from "bignumber.js";
import { customAlphabet, nanoid } from "nanoid";
import {
    AccountProvider,
    Airdrop,
    AirdropClaim,
    User,
} from "src/core/infra/postgres/entities";
import { AirdropClaimStatus } from "src/core/infra/postgres/entities/Airdrop";
import { v4 as uuidv4 } from "uuid";
import { airdropClaimRepo, airdropRepo } from "../infra/postgres";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { solana } from "src/utils/solana";
import { Keypair, PublicKey } from "@solana/web3.js";
import base58 = require("bs58");
import { NonRetriableError } from "inngest";
import { isNil } from "lodash";
import { helius } from "src/utils";
import { config } from "src/config";

// nanoid custom alphabet with only numbers and letters
const nanoidAlphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const customNanoId = customAlphabet(nanoidAlphabet, 8);
const AMOUNT_FOR_INVITER_PERCENT = 80;

export const INVITER_MULTIPLIER = new BigNumber(AMOUNT_FOR_INVITER_PERCENT).div(
    100
);

const create = async (
    airdrop: Airdrop,
    user: User
): Promise<FailureOrSuccess<DefaultErrors, AirdropClaim>> => {
    const totalAmount = new BigNumber(airdrop.amountPerClaim);
    const inviterAmount = totalAmount.multipliedBy(INVITER_MULTIPLIER);
    const invitedAmount = totalAmount.minus(inviterAmount);

    const airdropClaimResponse = await airdropClaimRepo.create({
        id: uuidv4(),
        airdropId: airdrop.id,
        status: AirdropClaimStatus.Pending,
        totalAmount: totalAmount.toNumber(),
        invitedAmount: invitedAmount.toNumber(),
        inviterAmount: inviterAmount.toNumber(),
        code: customNanoId().toLowerCase(),
        chain: airdrop.provider,
        transactionHash: null,
        inviterUserId: user.id,
        invitedUserId: null,
        submittedAt: null,
        transactionStatus: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return airdropClaimResponse;
};

const buildAirdropTransaction = async (
    airdropClaim: AirdropClaim
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            rawTransaction: string;
            blockhash: string;
        }
    >
> => {
    if (airdropClaim.chain === AccountProvider.Solana) {
        if (!airdropClaim.invitedUserId) {
            return failure(
                new UnexpectedError(
                    "No user was invited, so the airdrop cannot be claimed."
                )
            );
        }

        if (!airdropClaim.inviterUserId) {
            return failure(
                new UnexpectedError(
                    "No user sent the invite, so the airdrop cannot be claimed."
                )
            );
        }

        const airdropResponse = await airdropRepo.findById(
            airdropClaim.airdropId
        );

        if (airdropResponse.isFailure()) {
            return failure(airdropResponse.error);
        }

        const airdrop = airdropResponse.value;

        // build the transaction for us to send to the user

        const [inviterUserResponse, invitedUserResponse] = await Promise.all([
            pgUserRepo.findById(airdropClaim.inviterUserId),
            pgUserRepo.findById(airdropClaim.invitedUserId),
        ]);

        if (inviterUserResponse.isFailure()) {
            return failure(inviterUserResponse.error);
        }

        if (invitedUserResponse.isFailure()) {
            return failure(invitedUserResponse.error);
        }

        const inviter = inviterUserResponse.value;
        const invited = invitedUserResponse.value;

        const inviterWallet = (inviter.wallets ?? []).find(
            (w) => w.provider === AccountProvider.Solana
        );
        const invitedWallet = (invited.wallets ?? []).find(
            (w) => w.provider === AccountProvider.Solana
        );

        const feePayer = solana.getMovementFeePayerKeypair();
        const airdropKeypair = solana.getMovementAirdropKeypair();

        if (!feePayer) {
            return failure(
                new NonRetriableError("No awaken fee payer is set.")
            );
        }

        if (!airdropKeypair) {
            return failure(
                new NonRetriableError("No awaken airdrop keypair is set.")
            );
        }

        const transactionResponse =
            await solana.buildClaimAirdropSendTransaction({
                mintAddress: airdrop.contractAddress,
                inviterWalletPubKey: inviterWallet?.publicKey!,
                invitedWalletPubKey: invitedWallet?.publicKey!,
                invitedAmount: airdropClaim.invitedAmount,
                inviterAmount: airdropClaim.inviterAmount,
                airdropKeypair: airdropKeypair,
                feePayerKeypair: feePayer,
            });

        if (transactionResponse.isFailure()) {
            return failure(transactionResponse.error);
        }

        const { txn, blockhash } = transactionResponse.value;
        const rawTransaction = base58.encode(txn.serialize());

        return success({
            rawTransaction,
            blockhash,
        });
    }

    return failure(new UnexpectedError("Chain not supported."));
};

const getInviterAmount = (a: Airdrop): number => {
    return new BigNumber(a.amountPerClaim)
        .multipliedBy(INVITER_MULTIPLIER)
        .toNumber();
};

const getInvitedAmount = (a: Airdrop): number => {
    return new BigNumber(a.amountPerClaim)
        .multipliedBy(new BigNumber(1).minus(INVITER_MULTIPLIER))
        .toNumber();
};

const getHasClaimed = async (me: User, airdrop: Airdrop): Promise<boolean> => {
    const hasClaimedAsInviterResponse =
        await airdropClaimRepo.findClaimForInviterUserMaybeNull(
            me.id,
            airdrop.id
        );

    if (hasClaimedAsInviterResponse.isFailure()) {
        return false;
    }

    const hasClaimed =
        hasClaimedAsInviterResponse.isSuccess() &&
        !isNil(hasClaimedAsInviterResponse) &&
        hasClaimedAsInviterResponse.value?.status ===
            AirdropClaimStatus.Succeeded;

    return hasClaimed;
};

const getEarnAmount = (userId: string, claim: AirdropClaim): BigNumber => {
    if (!claim) {
        return new BigNumber(0);
    }

    let amount = new BigNumber(0);

    if (claim.inviterUserId === userId) {
        amount = amount.plus(claim.inviterAmount);
    }

    if (claim.invitedUserId === userId) {
        amount = amount.plus(claim.invitedAmount);
    }

    return amount;
};

const canClaim = async (
    claim: AirdropClaim
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    const airdropResponse = await airdropRepo.findById(claim.airdropId);

    if (airdropResponse.isFailure()) {
        return failure(airdropResponse.error);
    }

    const airdrop = airdropResponse.value;
    let pubKey = airdrop.airdropPubkey;

    if (!pubKey) {
        const keypair = solana.getMovementAirdropKeypair();

        if (!keypair) {
            return failure(
                new UnexpectedError("No movement airdrop keypair is set.")
            );
        }

        pubKey = keypair.publicKey.toBase58();
    }

    if (!pubKey) {
        return failure(
            new UnexpectedError("No movement airdrop pubkey is set.")
        );
    }

    const tokenResponse = await helius.tokens.metadataV2(
        airdrop.contractAddress
    );

    if (tokenResponse.isFailure()) {
        return failure(tokenResponse.error);
    }

    const token = tokenResponse.value;
    const tokenProgramId = token.token_info.token_program;

    const associatedTokenAccount = solana.associatedTokenAccountAddress(
        new PublicKey(airdrop.contractAddress),
        new PublicKey(pubKey),
        new PublicKey(tokenProgramId)
    );
    await helius.tokens.getTokenAccount(pubKey, airdrop.contractAddress);

    const tokenAccountResponse = await helius.tokens.getTokenAccount(
        associatedTokenAccount.toBase58(),
        tokenProgramId
    );

    if (tokenAccountResponse.isFailure()) {
        return failure(tokenAccountResponse.error);
    }

    const tokenAccount = tokenAccountResponse.value;
    const totalClaimAmount = new BigNumber(claim.totalAmount);
    const remainingTokenAccountBalance = new BigNumber(
        tokenAccount.amount.toString()
    ).div(new BigNumber(10).pow(token.token_info.decimals));

    console.log(
        `[claim ${claim.id}: ${remainingTokenAccountBalance.toString()} ${
            token.token_info.symbol
        }]`
    );
    console.log(
        `[trying to claim: ${totalClaimAmount.toString()} ${
            token.token_info.symbol
        }`
    );

    // make sure the remaining is big enough to cover it
    if (remainingTokenAccountBalance.lte(totalClaimAmount)) {
        return failure(
            new UnexpectedError(
                "This airdrop is finished! There aren't any more tokens left to claim."
            )
        );
    }

    return success(null);
};

export const AirdropClaimService = {
    create,
    buildAirdropTransaction,
    getInviterAmount,
    getInvitedAmount,
    getHasClaimed,
    getEarnAmount,
    canClaim,
};
