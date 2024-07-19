import { failure, success } from "src/core/logic";
import { TradingIntegrationProviderService, Token } from "../../types";
import { PriorityLevel, coingecko, helius } from "src/utils";
import { connect } from "src/core/infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { getCoingeckoForToken } from "src/shared/coingecko/getCoingeckoForToken";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { WRAPPED_SOL_MINT } from "./constants";
import { CoinGeckoTokenId } from "src/utils/coingecko/types";
import {
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    createTransferCheckedInstruction,
    createTransferInstruction,
    getAccount,
    getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import BigNumber from "bignumber.js";
import { connection } from "src/utils/helius/constants";
import * as bs from "bs58";
import { getAssociatedTokenAccountAddress, solana } from "src/utils/solana";

export const buildWithdrawTransaction: TradingIntegrationProviderService["buildWithdrawTransaction"] =
    async ({
        contractAddress,
        amount,
        toWalletAddress,
        fromWalletAddress,
        isNativeToken,
    }) => {
        const movementFeePayer = solana.getMovementFeePayerKeypair();

        // make sure the to and from are valid solana pub keys
        // if not, throw an error
        if (!PublicKey.isOnCurve(toWalletAddress)) {
            return failure(new Error("Invalid to wallet address."));
        }

        if (!PublicKey.isOnCurve(fromWalletAddress)) {
            return failure(new Error("Invalid from wallet address."));
        }

        const [blockheightResponse] = await Promise.all([
            helius.blocks.current(),
        ]);

        if (blockheightResponse.isFailure()) {
            return failure(blockheightResponse.error);
        }

        const { blockhash, lastValidBlockHeight } = blockheightResponse.value;
        const feePayer =
            movementFeePayer?.publicKey || new PublicKey(fromWalletAddress);

        if (isNativeToken || contractAddress === WRAPPED_SOL_MINT) {
            // make a solana transaction for the amount to transfer it
            // to this wallet address
            const instructions: TransactionInstruction[] = [];

            instructions.push(
                SystemProgram.transfer({
                    fromPubkey: new PublicKey(fromWalletAddress),
                    toPubkey: new PublicKey(toWalletAddress),
                    lamports: amount
                        .multipliedBy(LAMPORTS_PER_SOL)
                        .dp(0, BigNumber.ROUND_DOWN)
                        .toNumber(),
                })
            );

            const txn = new TransactionMessage({
                instructions,
                payerKey: feePayer,
                recentBlockhash: blockhash,
            });

            const msgV0 = txn.compileToV0Message();

            const versionTxn = new VersionedTransaction(msgV0);

            if (
                movementFeePayer &&
                movementFeePayer.publicKey.equals(feePayer)
            ) {
                console.log(`[movement is signing the transaction...]`);
                versionTxn.sign([movementFeePayer]);
            }

            // make it base64
            const serialized = Buffer.from(versionTxn.serialize()).toString(
                "base64"
            );

            return success({
                txn: serialized,
                solanaBlockhash: blockhash,
                solanaLastValidBlockHeight: lastValidBlockHeight,
            });
        }

        const tokenResponse = await helius.tokens.metadataV2(contractAddress);

        if (tokenResponse.isFailure()) {
            return failure(tokenResponse.error);
        }

        const mintAddress = new PublicKey(contractAddress);
        const token = tokenResponse.value;
        const tokenProgramId = new PublicKey(token.token_info.token_program);

        const toAssociatedTokenAccount = getAssociatedTokenAccountAddress(
            new PublicKey(contractAddress),
            new PublicKey(toWalletAddress),
            tokenProgramId
        );

        const fromAssociatedTokenAccount = getAssociatedTokenAccountAddress(
            new PublicKey(contractAddress),
            new PublicKey(fromWalletAddress),
            tokenProgramId
        );

        const instructions: TransactionInstruction[] = [];

        // see if the to address has an associated account, if not we need to make it
        // so we can send the user the tokens in the first place
        const tokenAccountResponse = await helius.wallets.hasTokenAccount({
            walletAddress: toWalletAddress,
            mintAddress: mintAddress.toBase58(),
        });

        if (tokenAccountResponse.isFailure()) {
            return failure(tokenAccountResponse.error);
        }

        const { hasTokenAccount } = tokenAccountResponse.value;

        if (!hasTokenAccount) {
            // have the fee payer (prob movement) pay for the token account it is being transferred to
            instructions.push(
                createAssociatedTokenAccountInstruction(
                    feePayer,
                    toAssociatedTokenAccount,
                    new PublicKey(toWalletAddress),
                    new PublicKey(contractAddress),
                    tokenProgramId
                )
            );
        }

        // see if the associated token account exists or not
        // if it doesn't, create an instruction to create it

        const amountWithDecimals = amount
            .multipliedBy(new BigNumber(10).pow(token.token_info.decimals))
            .dp(0, BigNumber.ROUND_DOWN);

        const signers = Array.from(
            new Set([feePayer.toBase58(), fromWalletAddress])
        );

        console.log(`[signers: ${signers.join(",")}]`);

        instructions.push(
            createTransferCheckedInstruction(
                fromAssociatedTokenAccount,
                mintAddress,
                toAssociatedTokenAccount, // to
                new PublicKey(fromWalletAddress), // from's owner
                amountWithDecimals.toNumber(),
                token.token_info.decimals,
                [new PublicKey(fromWalletAddress)],
                tokenProgramId
            )
        );

        const txn = new TransactionMessage({
            instructions,
            payerKey: feePayer,
            recentBlockhash: blockhash,
        });

        const msgV0 = txn.compileToV0Message();

        const versionTxn = new VersionedTransaction(msgV0);

        if (movementFeePayer && movementFeePayer.publicKey.equals(feePayer)) {
            console.log(`[movement is signing the transaction...]`);
            versionTxn.sign([movementFeePayer]);
        }

        // make it base64
        const serialized = Buffer.from(versionTxn.serialize()).toString(
            "base64"
        );

        // console.log(serialized);

        return success({
            txn: serialized,
            solanaBlockhash: blockhash,
            solanaLastValidBlockHeight: lastValidBlockHeight,
        });
    };

if (require.main === module) {
    connect()
        .then(async () => {
            const response = await buildWithdrawTransaction({
                contractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                toWalletAddress: "79GZRSLYTgPka6NTQ3H2Xj68Pq7smmpghk6NDPnvhqX7",
                fromWalletAddress:
                    "GWaxhgByJRYwQUrj3LzG1L1LzNm5cqB227WqzNLQBzLK",
                amount: new BigNumber(5),
                isNativeToken: false,
            });

            console.log(response);
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
