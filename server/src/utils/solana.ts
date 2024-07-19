import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    guardSwitch,
    hasValue,
    success,
} from "src/core/logic";
import {
    connection,
    depr_atlasConnection,
    // depr_heliusDedicatedRpc,
    ironForgeConnection,
} from "./helius/constants";
import {
    Connection,
    Keypair,
    ParsedTransactionWithMeta,
    PublicKey,
    SendOptions,
    Transaction,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import {
    HeliusTokenDASMetadata,
    HeliusTokenMintExtensions,
    helius,
} from "./helius";
import { sleep } from "radash";
import * as bs58 from "bs58";
import { config } from "src/config";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    ExtensionType,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createCloseAccountInstruction,
    createSyncNativeInstruction,
    createTransferCheckedInstruction,
    getMinimumBalanceForRentExemptAccount,
    getMinimumBalanceForRentExemptAccountWithExtensions,
    getMinimumBalanceForRentExemptMintWithExtensions,
} from "@solana/spl-token";
import { jito } from "./jito";
import { Datadog } from "./datadog";
import { isNil, omit } from "lodash";
import { SystemProgram } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { Slack, SlackChannel } from "./slack";

export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
export const WRAPPED_SOL_RENT_AMOUNT = 0.00203928;

export const _tryToSendRaw = async (
    name: string,
    conn: Maybe<Connection>,
    rawTransaction: Uint8Array,
    options?: SendOptions
): Promise<string | null> => {
    if (!conn) {
        return null;
    }

    try {
        // Await the promise to ensure it completes before proceeding.
        const transactionId = await conn.sendRawTransaction(
            rawTransaction,
            options
        );

        // console.log(`[sent to ${name}]`);

        Datadog.increment("solana.submit_transaction.rpc.ok", {
            rpc: name,
        });

        return transactionId;
    } catch (err) {
        console.log(`[error with ${name}]`);
        console.log(err);

        Datadog.increment("solana.submit_transaction.rpc.err", {
            rpc: name,
        });

        // Log the error message for more detailed debugging information.
        return null;
    }
};

const _submitTransaction = async (
    rawTransaction: Uint8Array,
    options?: SendOptions
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    try {
        const [signature1, signature2] = await Promise.all([
            _tryToSendRaw("helius", connection, rawTransaction, options),
            _tryToSendRaw(
                "iron-forge",
                ironForgeConnection,
                rawTransaction,
                options
            ),
            // fallback to iron-forge
            // _tryToSendRaw(
            //     "dedicated",
            //     depr_heliusDedicatedRpc,
            //     rawTransaction,
            //     options
            // ),
            // _tryToSendRaw(
            //     "triton",
            //     tritonConnection,
            //     rawTransaction,
            //     options
            // ),
        ]);

        const signature = signature1 || signature2; // || signature3; // || signature4;

        if (!signature) {
            Datadog.increment("solana.submit_transaction.err", {
                type: "no_signature",
            });

            console.log("no signature");
            return failure(new UnexpectedError("Error sending transaction"));
        }

        const rpcs = [
            signature1 ? "helius" : null,
            signature2 ? "iron-forge" : null,
            // signature3 ? "atlas" : null,
            // signature3 ? "dedicated" : null,
            // signature5 ? "triton" : null,
        ].filter(hasValue);

        console.log(`[sent to ${rpcs.join(",")} rpcs]`);

        Datadog.increment("solana.submit_transaction.ok");

        return success(signature);
    } catch (err) {
        console.log(err);

        Datadog.increment("solana.submit_transaction.err", {
            message: (err as any).message,
        });

        return failure(new UnexpectedError(err));
    }
};

const submitTransactionWithRetry = async (
    rawTransaction: Uint8Array,
    options?: SendOptions
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        const response = await _submitTransaction(rawTransaction, options);

        if (response.isSuccess()) {
            return response;
        }

        retries += 1;

        await sleep(250);
    }

    return failure(new UnexpectedError("Error sending transaction"));
};

export const logTransactionSize = (versionTxn: VersionedTransaction) => {
    try {
        const serialized = versionTxn.serialize();

        const size = serialized.length;

        console.log(`[txn size ${size} bytes]`);
        // console.log(
        //     "instructions: " + versionTxn.message.compiledInstructions.length
        // );

        if (size > 1232) {
            console.log(`Transaction packet too large! ${size} bytes.`);
            void Slack.send({
                channel: SlackChannel.Swaps,
                format: true,
                message: `Transaction packet too large! ${size} bytes.`,
            });
            Datadog.increment("transaction.size.err");
        } else {
            Datadog.increment("transaction.size.ok");
        }
    } catch (err) {
        //
    }
};

const submitInitial = async (
    rawTransaction: string,
    blockhash: string,
    shouldAwaitJito: boolean
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    const txn = VersionedTransaction.deserialize(bs58.decode(rawTransaction));

    logTransactionSize(txn);

    const opts: SendOptions = {
        skipPreflight: true,
        maxRetries: 0,
        preflightCommitment: "confirmed",
    };

    const signatureResponse = await solana.submitTransactionWithRetry(
        bs58.decode(rawTransaction),
        opts
    );

    if (signatureResponse.isFailure()) {
        Datadog.increment("solana.submit_initial.err");

        return failure(signatureResponse.error);
    }

    if (shouldAwaitJito) {
        const res = await jito.bundles.sendWithRetry(
            [bs58.decode(rawTransaction)],
            blockhash
        );

        if (res.isFailure()) {
            return failure(res.error);
        }

        return signatureResponse;
    }

    // fire off to jito real quick don't wait bc it can take a long time
    void jito.bundles.sendWithRetry([bs58.decode(rawTransaction)], blockhash);

    Datadog.increment("solana.submit_initial.ok");

    return signatureResponse;
};

const submitAndWait = async (
    currentBlockHeight: number,
    _rawTransaction: string
): Promise<
    FailureOrSuccess<SolanaError, { signature: string; durationMS: number }>
> => {
    const rawTransaction = bs58.decode(_rawTransaction);

    const start = Date.now();
    const blockheightResponse = await helius.blocks.current();

    if (blockheightResponse.isFailure()) {
        const end = Date.now();

        return failure(
            new SolanaError(
                "Error getting blockheight, try again soon 🕐",
                "blockheight",
                end - start
            )
        );
    }

    if (!currentBlockHeight) {
        const end = Date.now();

        return failure(
            new SolanaError(
                "Error getting blockheight, try again soon 🕐",
                "no_blockheight",
                end - start
            )
        );
    }

    const lastValidBlockHeight = currentBlockHeight + 150;

    let blockheight = blockheightResponse.value.lastValidBlockHeight;
    let finalSignature: Maybe<string> = null;
    let counter = 1;

    const opts: SendOptions = {
        skipPreflight: true,
        maxRetries: 0,
        preflightCommitment: "confirmed",
    };

    console.log("sending txn to solana");

    while (blockheight < lastValidBlockHeight) {
        console.log(`[checking ${counter}. height: ${blockheight}]`);

        const submitResponse = await submitTransactionWithRetry(
            rawTransaction,
            opts
        );

        if (counter === 1 && submitResponse.isSuccess()) {
            console.log("signature: ", submitResponse.value);
        }

        if (submitResponse.isFailure()) {
            await sleep(250);

            const blockheightResponse = await helius.blocks.current();

            if (blockheightResponse.isSuccess()) {
                blockheight = blockheightResponse.value.lastValidBlockHeight;
                counter += 1;
            }
            continue;
        }

        const tempSignature = submitResponse.value;

        const resultStatus = await helius.transactions.isReceived(
            tempSignature
        );

        if (resultStatus.isSuccess()) {
            finalSignature = tempSignature;
            console.log(
                `[✅ - Transaction ${tempSignature} ${resultStatus.value}`
            );
            break;
        }

        await sleep(250);

        const blockheightResponse = await helius.blocks.current();

        if (blockheightResponse.isSuccess()) {
            blockheight = blockheightResponse.value.lastValidBlockHeight;
            counter += 1;
        }
    }

    if (!finalSignature) {
        const end = Date.now();

        return failure(
            new SolanaError(
                "Transaction not received, try again soon 🕐",
                "timeout",
                end - start
            )
        );
    }

    return success({
        signature: finalSignature as string,
        durationMS: Date.now() - start,
    });
};

const resSubmitAndWait = async (
    currentBlockHeight: number,
    signature: string,
    _rawTransaction: string
): Promise<
    FailureOrSuccess<SolanaError, { signature: string; durationMS: number }>
> => {
    const rawTransaction = bs58.decode(_rawTransaction);

    const start = Date.now();
    const blockheightResponse = await helius.blocks.current();

    if (blockheightResponse.isFailure()) {
        const end = Date.now();

        return failure(
            new SolanaError(
                "Error getting blockheight, try again soon 🕐",
                "blockheight",
                end - start
            )
        );
    }

    if (!currentBlockHeight) {
        const end = Date.now();

        return failure(
            new SolanaError(
                "Error getting blockheight, try again soon 🕐",
                "no_blockheight",
                end - start
            )
        );
    }

    const lastValidBlockHeight = currentBlockHeight + 150;

    let blockheight = blockheightResponse.value.lastValidBlockHeight;
    let finalSignature: Maybe<string> = null;
    let counter = 1;

    const opts: SendOptions = {
        skipPreflight: true,
        maxRetries: 0,
        preflightCommitment: "confirmed",
    };

    console.log("sending txn to solana");

    // if there is a signature -> check to see if it is received already
    if (signature) {
        // look it up to see if it's already been received
        const resultStatus = await helius.transactions.isReceived(signature);

        if (resultStatus.isSuccess()) {
            finalSignature = signature;
            console.log(`[✅ - Transaction ${signature} ${resultStatus.value}`);

            return success({
                signature: signature,
                durationMS: Date.now() - start,
            });
        }
    }

    while (blockheight < lastValidBlockHeight) {
        console.log(`[checking ${counter}. height: ${blockheight}]`);

        const submitResponse = await submitTransactionWithRetry(
            rawTransaction,
            opts
        );

        if (counter === 1 && submitResponse.isSuccess()) {
            console.log("signature: ", submitResponse.value);
        }

        if (submitResponse.isFailure()) {
            await sleep(250);

            const blockheightResponse = await helius.blocks.current();

            if (blockheightResponse.isSuccess()) {
                blockheight = blockheightResponse.value.lastValidBlockHeight;
                counter += 1;
            }
            continue;
        }

        const tempSignature = submitResponse.value;

        const resultStatus = await helius.transactions.isReceived(
            tempSignature
        );

        if (resultStatus.isSuccess()) {
            finalSignature = tempSignature;
            console.log(
                `[✅ - Transaction ${tempSignature} ${resultStatus.value}`
            );
            break;
        }

        await sleep(250);

        const blockheightResponse = await helius.blocks.current();

        if (blockheightResponse.isSuccess()) {
            blockheight = blockheightResponse.value.lastValidBlockHeight;
            counter += 1;
        }
    }

    if (signature) {
        // look it up to see if it's already been received
        const resultStatus = await helius.transactions.isReceived(signature);

        if (resultStatus.isSuccess()) {
            console.log(`[✅ - Transaction ${signature} ${resultStatus.value}`);

            return success({
                signature: signature,
                durationMS: Date.now() - start,
            });
        }
    }

    if (!finalSignature) {
        const end = Date.now();

        return failure(
            new SolanaError(
                "Transaction not received, try again soon 🕐",
                "timeout",
                end - start
            )
        );
    }

    return success({
        signature: finalSignature as string,
        durationMS: Date.now() - start,
    });
};

export type SolanaErrorType = "timeout" | "blockheight" | "no_blockheight";

export class SolanaError extends Error {
    durationMs: number;
    type: SolanaErrorType;
    constructor(message: string, type: SolanaErrorType, durationMS: number) {
        super(message);
        this.name = "SolanaError";
        this.type = type;
        this.durationMs = durationMS;
    }
}

const getMovementFeePayerKeypair = (): Maybe<Keypair> => {
    const privateKey = config.awakenFeePayer.privateKey;

    if (!privateKey) {
        return null;
    }

    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    return keypair;
};

const getMovementFundAccountKeypair = (): Maybe<Keypair> => {
    const privateKey = config.movement.fundAccountPrivateKey;

    if (!privateKey) {
        return null;
    }

    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    return keypair;
};

const getMovementOnrampKeypair = (): Maybe<Keypair> => {
    const privateKey = config.movement.onrampPrivateKey;

    if (!privateKey) {
        return null;
    }

    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    return keypair;
};

const getMovementAirdropKeypair = (): Maybe<Keypair> => {
    const privateKey = config.movement.airdropPrivateKey;

    if (!privateKey) {
        return null;
    }

    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    return keypair;
};

function associatedTokenAccountAddress(
    mint: PublicKey,
    wallet: PublicKey,
    programId: PublicKey
): PublicKey {
    return PublicKey.findProgramAddressSync(
        [wallet.toBuffer(), programId.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
}

async function getAccountSizeForMint(
    mintAddress: string
): Promise<FailureOrSuccess<DefaultErrors, number>> {
    try {
        const tokenResponse = await helius.tokens.metadataV2(mintAddress);

        if (tokenResponse.isFailure()) {
            return failure(tokenResponse.error);
        }

        const token = tokenResponse.value;
        const isToken2022 =
            token.token_info?.token_program ===
            TOKEN_2022_PROGRAM_ID.toBase58();

        if (!isToken2022) {
            const size = await getMinimumBalanceForRentExemptAccount(
                connection
            );

            return success(size);
        }

        // all of them appear to be this size but IDK
        // need to fix deeper later
        if (isToken2022) {
            return success(
                new BigNumber(0.0021576)
                    .multipliedBy(new BigNumber(10).pow(9))
                    .toNumber()
            );
        }

        // $CWIF
        if (token.id === "7atgF8KQo4wJrD5ATGX7t1V2zVvykPJbFfNeVf1icFv1") {
            return success(
                new BigNumber(0.0021576)
                    .multipliedBy(new BigNumber(10).pow(9))
                    .toNumber()
            );
        }

        const extensions = _getExtensionsForToken(token);

        console.log("EXTENSIONS: " + extensions);

        const acctSize =
            await getMinimumBalanceForRentExemptAccountWithExtensions(
                connection,
                extensions
            );

        // just add 1,000 buffer
        const size = acctSize;

        console.log("SIZE: " + size);

        return success(size);
    } catch (error) {
        console.error("Failed to get account size for mint address:", error);
        return failure(new UnexpectedError(error));
    }
}

const _getExtensionsForToken = (
    token: HeliusTokenDASMetadata
): ExtensionType[] => {
    const extensions: ExtensionType[] = [];

    const mintExtensions = token.mint_extensions || null;

    if (!mintExtensions) return extensions;

    for (const _key of Object.keys(mintExtensions)) {
        const key = _key as keyof HeliusTokenMintExtensions;

        let extension;

        switch (key) {
            case "confidential_transfer_account":
                extension = ExtensionType.ConfidentialTransferAccount;
                break;
            case "transfer_fee_config":
                extension = ExtensionType.TransferFeeConfig;
                break;
            case "confidential_transfer_mint":
                extension = ExtensionType.ConfidentialTransferMint;
                break;
            case "default_account_state":
                extension = ExtensionType.DefaultAccountState;
                break;
            case "interest_bearing_config":
                extension = ExtensionType.InterestBearingConfig;
                break;
            case "mint_close_authority":
                extension = ExtensionType.MintCloseAuthority;
                break;
            case "permanent_delegate":
                extension = ExtensionType.PermanentDelegate;
                break;
            case "transfer_hook":
            case "metadata_pointer":
            case "metadata":
            case "confidential_transfer_fee_config":
                break;
            default: {
                break;
            }
        }

        if (extension) extensions.push(extension);
    }

    return extensions;
};

export function getAssociatedTokenAccountAddress(
    mint: PublicKey,
    wallet: PublicKey,
    programId: PublicKey
): PublicKey {
    return PublicKey.findProgramAddressSync(
        [wallet.toBuffer(), programId.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
}

const isValidPubkey = (pubkey: string): boolean => {
    try {
        new PublicKey(pubkey);
        return true;
    } catch (error) {
        return false;
    }
};

const buildClaimAirdropSendTransaction = async ({
    mintAddress,
    invitedAmount,
    invitedWalletPubKey,
    inviterAmount,
    inviterWalletPubKey,
    feePayerKeypair,
    airdropKeypair,
}: {
    mintAddress: string;
    inviterWalletPubKey: string;
    inviterAmount: number;
    invitedWalletPubKey: string;
    invitedAmount: number;
    feePayerKeypair: Keypair;
    airdropKeypair: Keypair;
}): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            txn: VersionedTransaction;
            blockhash: string;
        }
    >
> => {
    const mintPubKey = new PublicKey(mintAddress);
    const tokenResponse = await helius.tokens.metadataV2(mintAddress);

    if (tokenResponse.isFailure()) {
        return failure(tokenResponse.error);
    }

    const token = tokenResponse.value;

    const [inviterHasTokenAccountResponse, invitedHasTokenAccountResponse] =
        await Promise.all([
            helius.wallets.hasTokenAccount({
                walletAddress: inviterWalletPubKey,
                mintAddress: mintAddress,
            }),
            helius.wallets.hasTokenAccount({
                walletAddress: invitedWalletPubKey,
                mintAddress: mintAddress,
            }),
        ]);

    if (inviterHasTokenAccountResponse.isFailure()) {
        return failure(inviterHasTokenAccountResponse.error);
    }

    if (invitedHasTokenAccountResponse.isFailure()) {
        return failure(invitedHasTokenAccountResponse.error);
    }

    const { hasTokenAccount: inviterHasTokenAccount } =
        inviterHasTokenAccountResponse.value;
    const { hasTokenAccount: invitedHasTokenAccount } =
        invitedHasTokenAccountResponse.value;

    const setupTokenAccountInstructions: TransactionInstruction[] = [];
    const tokenProgramId = new PublicKey(token.token_info.token_program);

    const airdropTokenAccountPubKey = getAssociatedTokenAccountAddress(
        new PublicKey(mintPubKey),
        new PublicKey(airdropKeypair.publicKey.toBase58()),
        tokenProgramId
    );

    const inviterTokenAccountPubKey = getAssociatedTokenAccountAddress(
        new PublicKey(mintPubKey),
        new PublicKey(inviterWalletPubKey),
        tokenProgramId
    );

    const invitedTokenAccountPubKey = getAssociatedTokenAccountAddress(
        new PublicKey(mintPubKey),
        new PublicKey(invitedWalletPubKey),
        tokenProgramId
    );

    if (!inviterHasTokenAccount) {
        const setupIXersResponse =
            await _getInstructionsForSettingUpTokenAccount(
                mintAddress,
                feePayerKeypair.publicKey.toBase58(),
                inviterWalletPubKey,
                inviterTokenAccountPubKey.toBase58()
            );

        if (setupIXersResponse.isFailure()) {
            return failure(setupIXersResponse.error);
        }

        const setupIXers = setupIXersResponse.value;

        setupTokenAccountInstructions.push(...setupIXers);
    }

    if (!invitedHasTokenAccount) {
        const setupIXersResponse =
            await _getInstructionsForSettingUpTokenAccount(
                mintAddress,
                feePayerKeypair.publicKey.toBase58(),
                invitedWalletPubKey,
                invitedTokenAccountPubKey.toBase58()
            );

        if (setupIXersResponse.isFailure()) {
            return failure(setupIXersResponse.error);
        }

        const setupIXers = setupIXersResponse.value;

        setupTokenAccountInstructions.push(...setupIXers);
    }

    const inviterAmountWithDecimals = new BigNumber(inviterAmount)
        .multipliedBy(new BigNumber(10).pow(token.token_info.decimals))
        .dp(0, BigNumber.ROUND_DOWN);

    const invitedAmountWithDecimals = new BigNumber(invitedAmount)
        .multipliedBy(new BigNumber(10).pow(token.token_info.decimals))
        .dp(0, BigNumber.ROUND_DOWN);

    const transferInviterIX = createTransferCheckedInstruction(
        airdropTokenAccountPubKey,
        mintPubKey,
        inviterTokenAccountPubKey,
        new PublicKey(airdropKeypair.publicKey),
        inviterAmountWithDecimals.toNumber(),
        token.token_info.decimals,
        [airdropKeypair],
        new PublicKey(token.token_info.token_program)
    );

    const transferInvitedIX = createTransferCheckedInstruction(
        airdropTokenAccountPubKey,
        mintPubKey,
        inviterTokenAccountPubKey,
        new PublicKey(airdropKeypair.publicKey),
        invitedAmountWithDecimals.toNumber(),
        token.token_info.decimals,
        [airdropKeypair],
        new PublicKey(token.token_info.token_program)
    );

    const [blockheightResponse] = await Promise.all([helius.blocks.current()]);

    if (blockheightResponse.isFailure()) {
        return failure(blockheightResponse.error);
    }

    const { blockhash } = blockheightResponse.value;

    const txn = new TransactionMessage({
        payerKey: feePayerKeypair.publicKey,
        recentBlockhash: blockhash,
        instructions: [
            ...setupTokenAccountInstructions,
            transferInviterIX,
            transferInvitedIX,
        ],
    });

    const messageV0 = txn.compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    tx.sign([feePayerKeypair, airdropKeypair]);

    return success({
        txn: tx,
        blockhash,
    });
};

const buildTokenRentTransferIX = async ({
    mint,
    fromPubKey,
    toPubKey,
}: {
    mint: string;
    fromPubKey: string;
    toPubKey: string;
}): Promise<FailureOrSuccess<DefaultErrors, TransactionInstruction[]>> => {
    // Minimum lamports required for Token Account
    const rentExemptLamportsResponse = await solana.getAccountSizeForMint(mint);

    if (rentExemptLamportsResponse.isFailure()) {
        return failure(rentExemptLamportsResponse.error);
    }

    const rentExemptLamports = rentExemptLamportsResponse.value;

    const init = SystemProgram.transfer({
        fromPubkey: new PublicKey(fromPubKey),
        toPubkey: new PublicKey(toPubKey),
        lamports: rentExemptLamports,
    });

    return success([
        init,
        // sync native instruction
        // createSyncNativeInstruction(new PublicKey(toPubKey)),
    ]);
};

const _getInstructionsForSettingUpTokenAccount = async (
    mintAddress: string,
    feePayerPubKey: string,
    walletPubKey: string,
    tokenAccountPubKey: string
): Promise<FailureOrSuccess<DefaultErrors, TransactionInstruction[]>> => {
    const rentTransferResponse = await buildTokenRentTransferIX({
        mint: mintAddress,
        fromPubKey: feePayerPubKey,
        toPubKey: walletPubKey,
    });

    if (rentTransferResponse.isFailure()) {
        return failure(rentTransferResponse.error);
    }

    const rentTransferIXs = rentTransferResponse.value;

    const tokenAccountIX = createAssociatedTokenAccountInstruction(
        new PublicKey(feePayerPubKey),
        new PublicKey(tokenAccountPubKey),
        new PublicKey(walletPubKey),
        new PublicKey(mintAddress)
    );

    return success([...rentTransferIXs, tokenAccountIX]);
};

const getFailedReason = async (hash: string): Promise<string | null> => {
    try {
        let transaction: Maybe<
            FailureOrSuccess<DefaultErrors, ParsedTransactionWithMeta | null>
        > = null;

        // try to get the transactions once per second for up to 10 seconds
        // sometimes it takes a bit for solana txn to be indexed and ready to pickup
        // so this helps when the txn does exist but an RPC is not returning it
        for (let i = 0; i < 10; i++) {
            transaction = await helius.transactions.getRawTransaction(hash);

            if (transaction.isSuccess() && !isNil(transaction.value)) {
                break;
            }

            await sleep(1000);
        }

        if (!transaction) {
            return null;
        }

        if (transaction.isFailure()) {
            return null;
        }

        const err = transaction.value?.meta?.err;

        if (!err) {
            return null;
        }

        const logs = transaction.value?.meta?.logMessages ?? [];

        console.log(logs);

        const isFrozen = logs.find((log) => log.includes("Account is frozen"));

        if (isFrozen) {
            return "The token account was frozen, so you won't be able to sell. This can happen if the token is a scam. If you have questions, contact customer support.";
        }

        const isSlippageExceeded = logs.find(
            (log) =>
                log.includes("Slippage tolerance exceeded") ||
                log.includes("SlippageToleranceExceeded") ||
                // orca returns this when slippage is exceeded
                log.toLowerCase().includes("invalid tick array sequence")
        );

        if (isSlippageExceeded) {
            return "The slippage tolerance was exceeded, so the transaction didn't go through. You can try it again, and if you still have problems contact customer support.";
        }

        const isInsufficientFunds = logs.find((log) =>
            log.includes("insufficient funds")
        );

        if (isInsufficientFunds) {
            return "You don't have enough funds. Please deposit more funds and try again.";
        }

        return null;
    } catch (err) {
        return null;
    }
};

const buildDepositTransaction = async ({
    mintAddress,
    amount,
    walletPubKey,
    feePayerKeypair,
    fundAccountKeypair,
}: {
    mintAddress: string;
    walletPubKey: string;
    amount: number;
    feePayerKeypair: Keypair;
    fundAccountKeypair: Keypair;
}): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            txn: VersionedTransaction;
            blockhash: string;
        }
    >
> => {
    const mintPubKey = new PublicKey(mintAddress);
    const tokenResponse = await helius.tokens.metadataV2(mintAddress);

    if (tokenResponse.isFailure()) {
        return failure(tokenResponse.error);
    }

    const token = tokenResponse.value;

    const walletHasTokenAccountResponse = await helius.wallets.hasTokenAccount({
        walletAddress: walletPubKey,
        mintAddress: mintAddress,
    });

    if (walletHasTokenAccountResponse.isFailure()) {
        return failure(walletHasTokenAccountResponse.error);
    }

    const { hasTokenAccount } = walletHasTokenAccountResponse.value;

    const setupTokenAccountInstructions: TransactionInstruction[] = [];
    const tokenProgramId = new PublicKey(token.token_info.token_program);

    // movement's deposit token account
    const depositTokenAccountPubKey = getAssociatedTokenAccountAddress(
        new PublicKey(mintPubKey),
        new PublicKey(fundAccountKeypair.publicKey.toBase58()),
        tokenProgramId
    );

    const userTokenAccountPubKey = getAssociatedTokenAccountAddress(
        new PublicKey(mintPubKey),
        new PublicKey(walletPubKey),
        tokenProgramId
    );

    if (!hasTokenAccount) {
        const tokenAccountIX = createAssociatedTokenAccountInstruction(
            new PublicKey(feePayerKeypair.publicKey),
            new PublicKey(userTokenAccountPubKey),
            new PublicKey(walletPubKey),
            new PublicKey(mintAddress)
        );

        setupTokenAccountInstructions.push(tokenAccountIX);
    }

    const amountWithDecimals = new BigNumber(amount)
        .multipliedBy(new BigNumber(10).pow(token.token_info.decimals))
        .dp(0, BigNumber.ROUND_DOWN);

    const transferToUserIX = createTransferCheckedInstruction(
        depositTokenAccountPubKey,
        mintPubKey,
        userTokenAccountPubKey,
        new PublicKey(fundAccountKeypair.publicKey),
        amountWithDecimals.toNumber(),
        token.token_info.decimals,
        [fundAccountKeypair],
        new PublicKey(token.token_info.token_program)
    );

    const [blockheightResponse] = await Promise.all([helius.blocks.current()]);

    if (blockheightResponse.isFailure()) {
        return failure(blockheightResponse.error);
    }

    const { blockhash } = blockheightResponse.value;

    const txn = new TransactionMessage({
        payerKey: feePayerKeypair.publicKey,
        recentBlockhash: blockhash,
        instructions: [...setupTokenAccountInstructions, transferToUserIX],
    });

    const messageV0 = txn.compileToV0Message();

    const tx = new VersionedTransaction(messageV0);

    tx.sign([feePayerKeypair, fundAccountKeypair]);

    return success({
        txn: tx,
        blockhash,
    });
};

const buildUnwrapSolTransaction = async (
    walletPublicKey: string
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            rawTransaction: string;
            blockhash: string;
            blockHeight: number;
        }
    >
> => {
    const blockResponse = await helius.blocks.current();

    if (blockResponse.isFailure()) {
        return failure(blockResponse.error);
    }

    const block = blockResponse.value;

    const associatedTokenAccount = solana.associatedTokenAccountAddress(
        new PublicKey(WRAPPED_SOL_MINT),
        new PublicKey(walletPublicKey),
        TOKEN_PROGRAM_ID
    );

    const closeAccountInstruction = createCloseAccountInstruction(
        associatedTokenAccount,
        new PublicKey(walletPublicKey),
        new PublicKey(walletPublicKey),
        [],
        TOKEN_PROGRAM_ID
    );

    const mvmtPayer = solana.getMovementFeePayerKeypair();

    if (!mvmtPayer) {
        return failure(
            new Error(
                "Movement gas relayer not initialized. Please contact support."
            )
        );
    }

    const messageV0 = new TransactionMessage({
        payerKey: mvmtPayer.publicKey,
        recentBlockhash: block.blockhash,
        instructions: [closeAccountInstruction],
    }).compileToV0Message();

    return success({
        rawTransaction: Buffer.from(messageV0.serialize()).toString("base64"),
        blockhash: block.blockhash,
        blockHeight: block.lastValidBlockHeight,
    });
};

export const solana = {
    resSubmitAndWait,
    getMovementFundAccountKeypair,
    getMovementAirdropKeypair,
    submitAndWait,
    submitTransactionWithRetry,
    getMovementFeePayerKeypair,
    getMovementOnrampKeypair,
    associatedTokenAccountAddress,
    getAccountSizeForMint,
    isValidPubkey,
    submitInitial,
    buildClaimAirdropSendTransaction,
    buildTokenRentTransferIX,
    getFailedReason,
    buildDepositTransaction,
    getInstructionsForSettingUpTokenAccount:
        _getInstructionsForSettingUpTokenAccount,
    buildUnwrapSolTransaction,
};
