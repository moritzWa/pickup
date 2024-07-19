import axios, { AxiosError, AxiosInstance } from "axios";
import BigNumber from "bignumber.js";
import { UnexpectedError, failure, hasValue, success } from "src/core/logic";
import { DefaultErrors, FailureOrSuccess, Maybe } from "src/core/logic";
import {
    JupiterPrice,
    JupiterQuote,
    JupiterQuoteParams,
    JupiterTransaction,
} from "./types";
import { Datadog, logHistogram } from "../datadog";
import {
    VersionedTransaction,
    AddressLookupTableAccount,
    TransactionMessage,
    TransactionInstruction,
    PublicKey,
    ComputeBudgetProgram,
    SystemProgram,
    Keypair,
} from "@solana/web3.js";
import * as bs from "bs58";
import { PriorityLevel, helius } from "../helius";
import { connection } from "../helius/constants";
import {
    getAssociatedTokenAccountAddress,
    logTransactionSize,
    solana,
} from "../solana";
import { config } from "src/config";
import {
    SOL_USDC_MINT,
    WRAPPED_SOL_MINT,
} from "src/shared/integrations/providers/solana/constants";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    closeAccountInstructionData,
    createAssociatedTokenAccount,
    createAssociatedTokenAccountIdempotentInstruction,
    createAssociatedTokenAccountInstruction,
    createCloseAccountInstruction,
    createSyncNativeInstruction,
    createTransferCheckedInstruction,
    createTransferInstruction,
    isSyncNativeInstruction,
    syncNativeInstructionData,
} from "@solana/spl-token";
import { STABLE_COIN_IDENTIFIERS } from "src/shared/domain/stablecoins";
import { jito } from "../jito";
import { Quote } from "src/core/infra/postgres/entities";
import { sumBigNumbers } from "../helpers";

// https://solscan.io/account/7nhc4ubxPbWoBcqMUNDy7zgfRCKG92ZhE6svmiT4mtku
// https://solscan.io/tx/2g3bRdU1BjVhKpJACUtSVebkeBqHbNYPP7x4YJGEQGtwV3pUvv4Z6xbrHBf4NxEhwrgn1Xic5Sv1sJ28bt3FXJ5g
const OUR_LOOKUP_ACCOUNT = new PublicKey(
    "7nhc4ubxPbWoBcqMUNDy7zgfRCKG92ZhE6svmiT4mtku"
);
const BASE_URL = config.jup.apiUrl;

console.log(`[jupiter base url: ${BASE_URL}]`);

const client = axios.create({
    baseURL: BASE_URL,
});

const sharedClient = axios.create({
    baseURL: "https://quote-api.jup.ag/v6",
});

const getQuote = async ({
    client,
    inputMint,
    outputMint,
    amount,
    slippageBps,
    potentialFeeBps,
    maxAccounts,
}: JupiterQuoteParams & {
    client: AxiosInstance;
}): Promise<FailureOrSuccess<DefaultErrors, JupiterQuote>> => {
    try {
        const fullAmount = new BigNumber(amount);
        const jupFeeAccount = await getJupiterFeeAccount(outputMint);

        const hasJupFeeAccount = !!jupFeeAccount;

        // console.log("has jup account: ", hasJupFeeAccount);

        // Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
        const quoteResponse = await client.get("/quote", {
            params: {
                inputMint: inputMint,
                outputMint: outputMint,
                amount: fullAmount.dp(0).toNumber(),
                slippageBps: slippageBps,
                maxAccounts,
                ...(hasJupFeeAccount
                    ? {
                          platformFeeBps: potentialFeeBps,
                      }
                    : {}),
            },
        });

        const quote = quoteResponse.data;

        Datadog.increment("jupiter.quotes.ok");

        return success(quote);
    } catch (err) {
        Datadog.increment("jupiter.quotes.err");

        debugger;

        if (err instanceof AxiosError) {
            console.log(JSON.stringify(err.response?.data, null, 2));
        }

        return failure(new UnexpectedError(err));
    }
};

const getQuoteV2 = async ({
    inputMint,
    outputMint,
    amount,
    slippageBps,
    potentialFeeBps,
    maxAccounts,
}: JupiterQuoteParams): Promise<
    FailureOrSuccess<DefaultErrors, JupiterQuote>
> => {
    const response = await getQuote({
        client: client,
        inputMint,
        outputMint,
        amount,
        slippageBps,
        potentialFeeBps,
        maxAccounts,
    });

    if (response.isSuccess()) {
        Datadog.increment("jupiter.hosted.quote.ok");

        return response;
    }

    Datadog.increment("jupiter.hosted.quote.err");

    // try other client
    return getQuote({
        client: sharedClient,
        inputMint,
        outputMint,
        amount,
        slippageBps,
        potentialFeeBps,
        maxAccounts,
    });
};

// retry get quote up to 3 times, maybe 250 ms in between each
const getQuoteV2WithRetry = async (
    params: JupiterQuoteParams
): Promise<FailureOrSuccess<DefaultErrors, JupiterQuote>> => {
    let retries = 0;
    let response = await getQuoteV2(params);

    while (response.isFailure() && retries < 3) {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 250));
        response = await getQuoteV2(params);
    }

    return response;
};

async function fetchFastestSwapInstructions(
    client: AxiosInstance,
    params: any
): Promise<FailureOrSuccess<DefaultErrors, any>> {
    // Helper function to make the API request and time it
    const makeRequest = async (): Promise<
        FailureOrSuccess<DefaultErrors, any>
    > => {
        try {
            const { data } = await client.post("/swap-instructions", params);
            return success(data);
        } catch (error) {
            console.timeEnd("swap-instructions");
            return failure(new UnexpectedError(error));
        }
    };

    // Create three requests
    const requests = [makeRequest(), makeRequest(), makeRequest()];

    try {
        // Use Promise.race to get the fastest response
        const fastestResponse = await Promise.race(requests);
        return fastestResponse;
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
}

const buildTransactionV2 = async (
    client: AxiosInstance,
    quote: JupiterQuote,
    walletPublicKey: string,
    feeBps: number,
    fullQuote: Quote
): Promise<FailureOrSuccess<DefaultErrors, JupiterTransaction>> => {
    try {
        const startTxnV2 = Date.now();

        const awakenFeePayer = solana.getMovementFeePayerKeypair();
        const jupFeeAccount = await getJupiterFeeAccount(quote.outputMint);

        const params = {
            quoteResponse: quote,
            userPublicKey: walletPublicKey,
            dynamicComputeUnitLimit: true,
            prioritizationFeeLamports: "auto",
            ...(jupFeeAccount
                ? {
                      feeAccount: jupFeeAccount.publicKey.toBase58(),
                  }
                : {}),
        };
        console.time("swap-instructions");
        const start = Date.now();
        const swapInstructionsResponse = await fetchFastestSwapInstructions(
            client,
            params
        );
        const end = Date.now();
        console.timeEnd("swap-instructions");

        if (swapInstructionsResponse.isFailure()) {
            return failure(swapInstructionsResponse.error);
        }

        const data = swapInstructionsResponse.value;

        logHistogram({
            metric: "jupiter.swap_instructions.latency",
            value: end - start,
        });

        const {
            tokenLedgerInstruction, // If you are using `useTokenLedger = true`.
            computeBudgetInstructions: rawComputeBudgetInstructions, // The necessary instructions to setup the compute budget.
            swapInstruction: swapInstructionPayload, // The actual swap instruction.
            addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
        } = data;

        const deserializeInstruction = (instruction: Maybe<any>) => {
            if (!instruction) return null;

            return new TransactionInstruction({
                programId: new PublicKey(instruction.programId),
                keys: instruction.accounts.map((key) => ({
                    pubkey: new PublicKey(key.pubkey),
                    isSigner: key.isSigner,
                    isWritable: key.isWritable,
                })),
                data: Buffer.from(instruction.data, "base64"),
            });
        };

        const getAddressLookupTableAccounts = async (
            keys: string[]
        ): Promise<AddressLookupTableAccount[]> => {
            const addressLookupTableAccountInfos =
                await connection.getMultipleAccountsInfo(
                    keys.map((key) => new PublicKey(key))
                );

            return addressLookupTableAccountInfos.reduce(
                (acc, accountInfo, index) => {
                    const addressLookupTableAddress = keys[index];
                    if (accountInfo) {
                        const addressLookupTableAccount =
                            new AddressLookupTableAccount({
                                key: new PublicKey(addressLookupTableAddress),
                                state: AddressLookupTableAccount.deserialize(
                                    accountInfo.data
                                ),
                            });
                        acc.push(addressLookupTableAccount);
                    }

                    return acc;
                },
                new Array<AddressLookupTableAccount>()
            );
        };

        const ourLookupTableAccountResponse =
            await connection.getAddressLookupTable(OUR_LOOKUP_ACCOUNT);

        const ourLookupAccount = ourLookupTableAccountResponse.value;

        const computeBudgetInstructions = rawComputeBudgetInstructions.map(
            (i): TransactionInstruction => ({
                programId: new PublicKey(i.programId),
                keys: i.accounts,
                data: Buffer.from(i.data, "base64"),
            })
        );

        const feePayer =
            awakenFeePayer?.publicKey || new PublicKey(walletPublicKey);

        console.time("start-promises");

        // build a fee taking from the input mint
        const [
            movementTxnFeeIXResponse,
            setupInstructionResponse,
            addressLookupTableAccounts,
            blockhashInfoResponse,
        ] = await Promise.all([
            buildFeeTransferInstruction({
                walletPublicKey,
                inputMint: quote.inputMint,
                inputAmount: quote.inAmount,
                isCollectingFeeFromJupiter: !!jupFeeAccount,
                feeBps: feeBps ?? 0,
                fullQuote,
            }),
            buildTokenAccountSetupInstructions({
                walletPublicKey,
                inputAmount: new BigNumber(quote.inAmount),
                outputMint: quote.outputMint,
                inputMint: quote.inputMint,
            }),
            getAddressLookupTableAccounts(addressLookupTableAddresses),
            helius.blocks.current(),
        ]);
        console.timeEnd("start-promises");

        if (movementTxnFeeIXResponse.isFailure()) {
            return failure(movementTxnFeeIXResponse.error);
        }

        if (setupInstructionResponse.isFailure()) {
            return failure(setupInstructionResponse.error);
        }

        if (blockhashInfoResponse.isFailure()) {
            return failure(blockhashInfoResponse.error);
        }

        const { blockhash, lastValidBlockHeight } = blockhashInfoResponse.value;

        // mvmt revenue 🤑
        const mvmtTxnFee = movementTxnFeeIXResponse.value;

        // transfer from the user to
        const instructions = [
            ...computeBudgetInstructions,
            ...setupInstructionResponse.value.instructions,
            mvmtTxnFee,
            deserializeInstruction(swapInstructionPayload),
            // to reclaim wrapped sol if needed
            ...setupInstructionResponse.value.closeInstructions,
        ].filter(hasValue);

        // console.log("INSTRUCTIONS: ", instructions.length);

        // console.log(`[movement paying fee: ${awakenIsFeePayer}]`);

        const transactionMessage = new TransactionMessage({
            payerKey: new PublicKey(feePayer),
            recentBlockhash: blockhash,
            instructions: instructions.filter(hasValue),
        });

        const msgV0 = transactionMessage.compileToV0Message(
            [...addressLookupTableAccounts, ourLookupAccount].filter(hasValue)
        );

        const versionTxn = new VersionedTransaction(msgV0);

        // if we are paying the fee -> sign it
        if (awakenFeePayer && awakenFeePayer.publicKey.equals(feePayer)) {
            // console.log(`[awaken is signing the transaction...]`);
            versionTxn.sign([awakenFeePayer]);
        }

        const swapTransaction = Buffer.from(versionTxn.serialize()).toString(
            "base64"
        );

        console.time("log-transaction-size");
        logTransactionSize(versionTxn);
        console.timeEnd("log-transaction-size");

        // log how many bytes the base64 string is
        // const bytes = Buffer.byteLength(swapTransaction, "base64");

        // console.log(`[swap transaction size: ${bytes} bytes]`);

        const endTxnV2 = Date.now();

        logHistogram({
            logToConsole: true,
            metric: "jupiter.swap_instructions_v2.latency",
            value: endTxnV2 - startTxnV2,
        });

        return success({
            swapTransaction: swapTransaction,
            lastValidBlockHeight: lastValidBlockHeight,
            blockhash: blockhash,
        });
    } catch (err) {
        console.error(err);
        return failure(new UnexpectedError(err));
    }
};

const buildTransactionWrapperV2 = async (
    fullQuote: Quote,
    quote: JupiterQuote,
    walletPublicKey: string,
    feeBps: number
): Promise<FailureOrSuccess<DefaultErrors, JupiterTransaction>> => {
    const response = await buildTransactionV2(
        client,
        quote,
        walletPublicKey,
        feeBps,
        fullQuote
    );

    if (response.isSuccess()) {
        Datadog.increment("jupiter.hosted.build.ok");
        return response;
    }

    Datadog.increment("jupiter.hosted.build.err");

    return buildTransactionV2(
        sharedClient,
        quote,
        walletPublicKey,
        feeBps,
        fullQuote
    );
};

// const buildTransaction = async (
//     quote: JupiterQuote,
//     walletPublicKey: string
// ): Promise<FailureOrSuccess<DefaultErrors, JupiterTransaction>> => {
//     try {
//         const [blockhashResponse, priorityFeeResponse] = await Promise.all([
//             helius.blocks.current(),
//             helius.fees.priorityForJupiter(),
//         ]);

//         if (blockhashResponse.isFailure()) {
//             return failure(blockhashResponse.error);
//         }

//         if (priorityFeeResponse.isFailure()) {
//             return failure(priorityFeeResponse.error);
//         }

//         // console.log(priorityFeeResponse);
//         const blockhash = blockhashResponse.value;
//         const priorityFee = Math.ceil(priorityFeeResponse.value.high);

//         const body = JSON.stringify({
//             // quoteResponse from /quote api
//             quoteResponse: quote,
//             // user public key to be used for the swap
//             userPublicKey: walletPublicKey,
//             // Restrict intermediate tokens to a top token set that has stable liquidity. This will help to ease potential high slippage error rate when swapping with minimal impact on pricing.
//             restrictIntermediateTokens: true,
//             // auto wrap and unwrap SOL. default is true
//             wrapAndUnwrapSol: true,
//             // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
//             // feeAccount: "fee_account_public_key"
//             dynamicComputeUnitLimit: true, // allow dynamic compute limit instead of max 1,400,000
//             // custom priority fee
//             prioritizationFeeLamports: priorityFee, // or custom lamports: 1000
//         });

//         // get serialized transactions for the swap
//         const data = await client.post<JupiterTransaction>("/swap", body);

//         Datadog.increment("jupiter.transactions.build.ok");

//         return success({
//             swapTransaction: data.data.swapTransaction,
//             lastValidBlockHeight: blockhash.lastValidBlockHeight,
//             blockhash: blockhash.blockhash,
//         });
//     } catch (err) {
//         console.error(err);
//         Datadog.increment("jupiter.transactions.build.err");
//         return failure(new UnexpectedError(err));
//     }
// };

const getPrice = async (
    client: AxiosInstance,
    mints: string[],
    vsToken: string = "USDC"
): Promise<FailureOrSuccess<DefaultErrors, JupiterPrice>> => {
    try {
        // debugger;

        // get serialized transactions for the swap
        const data = await client.get<JupiterPrice>(
            // Note: we use
            "https://quote-api.jup.ag/v4/price",
            {
                params: {
                    ids: mints.join(","),
                    vsToken: vsToken,
                },
            }
        );

        Datadog.increment("jupiter.price.ok");

        return success(data.data);
    } catch (err) {
        console.error(err);
        Datadog.increment("jupiter.price.err");
        return failure(new UnexpectedError(err));
    }
};

export const getPriceV2 = async (
    mints: string[],
    vsToken: string = "USDC"
): Promise<FailureOrSuccess<DefaultErrors, JupiterPrice>> => {
    const response = await getPrice(client, mints, vsToken);

    if (response.isSuccess()) {
        Datadog.increment("jupiter.hosted.price.ok");

        return response;
    }

    Datadog.increment("jupiter.hosted.price.err");

    return getPrice(sharedClient, mints, vsToken);
};

export const canCollectFeeForSOLMint = async (
    mint: string
): Promise<boolean> => {
    if (mint === WRAPPED_SOL_MINT) return true;
    if (mint === SOL_USDC_MINT) return true; // usdc
    return false;
};

const getJupiterFeeAccount = async (
    outputMint: string
): Promise<
    Maybe<{
        publicKey: PublicKey;
    }>
> => {
    try {
        const canCollectFee = await canCollectFeeForSOLMint(outputMint);

        if (!canCollectFee) {
            return null;
        }

        // don't fail loudly for this
        if (
            !solana.isValidPubkey(config.movement.jupiterReferralAccountPubKey)
        ) {
            console.log(
                `[warning - invalid referral account pubkey for jupiter]`
            );
            return null;
        }

        const referralAccountPubkey = new PublicKey(
            config.movement.jupiterReferralAccountPubKey
        );
        const outputMintPubKey = new PublicKey(outputMint);

        const [feeAccount] = await PublicKey.findProgramAddressSync(
            [
                Buffer.from("referral_ata"),
                referralAccountPubkey.toBuffer(), // your referral account public key
                outputMintPubKey.toBuffer(),
            ],
            new PublicKey("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3") // the JUP Referral Program
        );

        return {
            publicKey: feeAccount,
        };
    } catch (err) {
        return null;
    }
};

const _getTransferCheckedInstruction = (
    inputMint: string,
    inputMintTokenProgramId: string,
    inputDecimals: number, // ex. 9
    mvmtRevenueAccount: string,
    userWalletPublicKey: string,
    fee: BigNumber
): FailureOrSuccess<DefaultErrors, TransactionInstruction> => {
    const mintAddress = new PublicKey(inputMint);
    const tokenProgramId = new PublicKey(inputMintTokenProgramId);

    const toAssociatedTokenAccount = getAssociatedTokenAccountAddress(
        new PublicKey(inputMint),
        new PublicKey(mvmtRevenueAccount),
        tokenProgramId
    );

    const fromAssociatedTokenAccount = getAssociatedTokenAccountAddress(
        new PublicKey(inputMint),
        new PublicKey(userWalletPublicKey),
        tokenProgramId
    );

    // token transfer
    return success(
        createTransferCheckedInstruction(
            fromAssociatedTokenAccount,
            mintAddress,
            toAssociatedTokenAccount, // to
            new PublicKey(userWalletPublicKey), // from's owner
            fee.toNumber(),
            inputDecimals,
            [new PublicKey(userWalletPublicKey)],
            tokenProgramId
        )
    );
};

const buildFeeTransferInstruction = async ({
    walletPublicKey,
    inputAmount,
    inputMint,
    isCollectingFeeFromJupiter,
    feeBps,
    fullQuote,
}: {
    walletPublicKey: string;
    inputMint: string;
    inputAmount: number | string;
    isCollectingFeeFromJupiter: boolean;
    feeBps: number;
    fullQuote: Quote;
}): Promise<FailureOrSuccess<DefaultErrors, Maybe<TransactionInstruction>>> => {
    if (isCollectingFeeFromJupiter) {
        return success(null);
    }

    const canCollectFee = await canCollectFeeForSOLMint(inputMint);
    const mvmtRevenueAccount = config.movement.feeAccountPubKey;

    if (!canCollectFee) {
        return success(null);
    }

    if (!mvmtRevenueAccount || !solana.isValidPubkey(mvmtRevenueAccount)) {
        return success(null);
    }

    if (!feeBps || feeBps === 0) {
        return success(null);
    }

    const feePercent = new BigNumber(feeBps).div(100); // 1 = 1%;

    // if the input mint is solana or a stable coin, we want 1% of that to be transferred to us
    const fee = new BigNumber(inputAmount)
        .multipliedBy(feePercent.div(100))
        .dp(0)
        .toNumber();

    // console.log("INPUT: ", inputAmount);
    // console.log("FEE: ", fee);
    // console.log("--------------");
    // console.log("TOTAL: ", new BigNumber(inputAmount).plus(fee).toNumber());

    const isSolana = inputMint === WRAPPED_SOL_MINT;
    const isUSDC = inputMint === SOL_USDC_MINT;

    if (isSolana) {
        // just add on any other fees here
        const otherFees = (fullQuote.fees ?? []).filter(
            (c) => c.tokenContractAddress === WRAPPED_SOL_MINT
        );

        const totalOtherFees = sumBigNumbers(
            otherFees.map((f) => new BigNumber(f.amount))
        ).multipliedBy(
            new BigNumber(10).pow(9) // 9 decimals for SOL
        );

        const totalFee = new BigNumber(fee)
            .plus(totalOtherFees)
            .dp(0, BigNumber.ROUND_UP);

        // if they
        return success(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(walletPublicKey),
                toPubkey: new PublicKey(mvmtRevenueAccount),
                lamports: totalFee.toNumber(),
            })
        );
    }

    if (isUSDC) {
        // just add on any other fees here
        const otherFees = (fullQuote.fees ?? []).filter(
            (c) => c.tokenContractAddress === SOL_USDC_MINT
        );

        const totalOtherFees = sumBigNumbers(
            otherFees.map((f) => new BigNumber(f.amount))
        ).multipliedBy(
            new BigNumber(10).pow(6) // 6 decimals for USDC
        );

        const totalFee = new BigNumber(fee)
            .plus(totalOtherFees)
            .dp(0, BigNumber.ROUND_UP);

        const transfer = _getTransferCheckedInstruction(
            inputMint,
            TOKEN_PROGRAM_ID.toBase58(),
            6, // USDC has 6 decimals on Solana
            mvmtRevenueAccount,
            walletPublicKey,
            new BigNumber(totalFee)
        );

        return transfer;
    }

    console.time("get-token-metadata");
    const tokenResponse = await helius.tokens.metadataV2(inputMint);
    console.timeEnd("get-token-metadata");

    if (tokenResponse.isFailure()) {
        return failure(tokenResponse.error);
    }

    const token = tokenResponse.value;

    const transfer = _getTransferCheckedInstruction(
        inputMint,
        token.token_info.token_program,
        token.token_info.decimals,
        mvmtRevenueAccount,
        walletPublicKey,
        new BigNumber(fee)
    );

    return transfer;
};

const buildTokenAccountTransferInstruction = async ({
    awakenIsFeePayer,
    walletPublicKey,
    outputMint,
    inputMint,
    feePayer,
}: {
    awakenIsFeePayer: boolean;
    walletPublicKey: string;
    outputMint: string;
    inputMint: string;
    feePayer: string;
}): Promise<
    FailureOrSuccess<
        DefaultErrors,
        Maybe<{
            initTokenAccountIX: TransactionInstruction[];
            closeTokenAccountIX: TransactionInstruction[];
        }>
    >
> => {
    if (!awakenIsFeePayer) {
        return success(null);
    }

    const initTokenAccountIXs: TransactionInstruction[] = [];
    const closeTokenAccountIXs: TransactionInstruction[] = [];

    const hasTokenAccountResponse = await helius.wallets.hasTokenAccount({
        walletAddress: walletPublicKey,
        mintAddress: outputMint,
    });

    const hasTokenAccountInputResponse = await helius.wallets.hasTokenAccount({
        walletAddress: walletPublicKey,
        mintAddress: inputMint,
    });

    if (hasTokenAccountResponse.isFailure()) {
        return failure(hasTokenAccountResponse.error);
    }

    // just adding a lil check for the frozen rugged tokens making sure the account isn't frozen.
    // if this errors tho it's fine we can just continue
    if (hasTokenAccountInputResponse.isSuccess()) {
        const { account } = hasTokenAccountInputResponse.value;

        // if account is frozen, exit early so we don't have to pay transaction fees
        if (account && account.isFrozen) {
            return failure(
                new Error(
                    "Token account is frozen, which means you won't be able to sell. This usually means the token is a scam."
                )
            );
        }
    }

    const { hasTokenAccount: hasTokenAccountForOutput, account } =
        hasTokenAccountResponse.value;

    console.log(
        `[has token account for ${outputMint}: ${hasTokenAccountForOutput}]`
    );

    if (account && account.isFrozen) {
        return failure(
            new Error(
                "Token account is frozen, which means you won't be able to sell. This usually means the token is a scam."
            )
        );
    }

    if (hasTokenAccountForOutput) {
        return success({
            initTokenAccountIX: [],
            closeTokenAccountIX: [],
        });
    }

    const instructionsResponse = await solana.buildTokenRentTransferIX({
        mint: outputMint,
        fromPubKey: feePayer,
        toPubKey: walletPublicKey,
    });

    if (instructionsResponse.isFailure()) {
        return failure(instructionsResponse.error);
    }

    initTokenAccountIXs.push(...instructionsResponse.value);

    return success({
        initTokenAccountIX: initTokenAccountIXs,
        closeTokenAccountIX: closeTokenAccountIXs,
    });
};

type BuildTokenAccountSetupData = {
    instructions: TransactionInstruction[];
    closeInstructions: TransactionInstruction[]; // if we should close an account at the end
};

const buildTokenAccountSetupInstructions = async ({
    walletPublicKey,
    inputMint,
    outputMint,
    inputAmount,
}: {
    walletPublicKey: string;
    inputMint: string;
    outputMint: string;
    inputAmount: BigNumber;
}): Promise<FailureOrSuccess<DefaultErrors, BuildTokenAccountSetupData>> => {
    const mvmtFeePayer = solana.getMovementFeePayerKeypair();
    const isSOLInput = inputMint === WRAPPED_SOL_MINT;
    const isSOLOutput = outputMint === WRAPPED_SOL_MINT;

    if (!mvmtFeePayer) {
        return failure(new Error("Movement fee payer not found"));
    }

    console.time("has-token-account");
    const [
        hasTokenAccountOutputResponse,
        hasTokenAccountInputResponse,
        hasWrappedSolResponse,
    ] = await Promise.all([
        helius.wallets.hasTokenAccount({
            walletAddress: walletPublicKey,
            mintAddress: outputMint,
        }),
        helius.wallets.hasTokenAccount({
            walletAddress: walletPublicKey,
            mintAddress: inputMint,
        }),
        helius.wallets.hasTokenAccount({
            walletAddress: walletPublicKey,
            mintAddress: WRAPPED_SOL_MINT,
            tokenProgramId: TOKEN_PROGRAM_ID.toBase58(),
        }),
    ]);

    if (hasTokenAccountOutputResponse.isFailure()) {
        return failure(hasTokenAccountOutputResponse.error);
    }

    if (hasTokenAccountInputResponse.isFailure()) {
        return failure(hasTokenAccountInputResponse.error);
    }

    if (hasWrappedSolResponse.isFailure()) {
        return failure(hasWrappedSolResponse.error);
    }

    // just adding a lil check for the frozen rugged tokens making sure the account isn't frozen.
    // if this errors tho it's fine we can just continue
    const { account } = hasTokenAccountInputResponse.value;

    // if account is frozen, exit early so we don't have to pay transaction fees
    // @ts-ignore
    if (account && account.isFrozen) {
        return failure(
            new Error(
                "Token account is frozen, which means you won't be able to sell. This usually means the token is a scam."
            )
        );
    }

    const {
        hasTokenAccount: hasTokenAccountForOutput,
        tokenAccountPubKey: outputTokenAccountPubKey,
        tokenProgramId: outputTokenProgramId,
    } = hasTokenAccountOutputResponse.value;

    const {
        hasTokenAccount: hasTokenAccountForInput,
        tokenAccountPubKey: inputTokenAccountPubKey,
        tokenProgramId: inputTokenProgramId,
    } = hasTokenAccountInputResponse.value;

    const {
        hasTokenAccount: hasTokenAccountForWrappedSol,
        tokenAccountPubKey: wrappedSolTokenAccountPubKey,
    } = hasWrappedSolResponse.value;

    const instructions: TransactionInstruction[] = [];

    // set a close instruction only if we pay for this account for them bc they don't have it
    const closeInstructions: TransactionInstruction[] = [];

    if (!hasTokenAccountForInput) {
        console.log(`[making instructions for input ATA]`);

        if (!inputTokenAccountPubKey || !inputTokenProgramId) {
            return failure(new Error("Input token account not found."));
        }

        const associatedTokenAccount =
            createAssociatedTokenAccountIdempotentInstruction(
                mvmtFeePayer.publicKey,
                new PublicKey(inputTokenAccountPubKey),
                new PublicKey(walletPublicKey),
                new PublicKey(inputMint),
                new PublicKey(inputTokenProgramId),
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

        instructions.push(associatedTokenAccount);

        // if the input mint is SOL, we need instructions for that
        if (isSOLInput) {
            const transfer = SystemProgram.transfer({
                fromPubkey: new PublicKey(walletPublicKey),
                toPubkey: new PublicKey(inputTokenAccountPubKey),
                lamports: inputAmount.toNumber(),
            });

            const syncNative = createSyncNativeInstruction(
                new PublicKey(inputTokenAccountPubKey),
                TOKEN_PROGRAM_ID
            );

            const closeAccountInstruction = createCloseAccountInstruction(
                new PublicKey(inputTokenAccountPubKey),
                mvmtFeePayer.publicKey,
                new PublicKey(walletPublicKey),
                [],
                new PublicKey(inputTokenProgramId)
            );

            instructions.push(...[transfer, syncNative]);
            closeInstructions.push(closeAccountInstruction);
        }
    }

    if (!hasTokenAccountForOutput) {
        console.log(`[making instructions for output ATA]`);

        // create associated token account
        if (!outputTokenAccountPubKey || !outputTokenProgramId) {
            return failure(new Error("Output token account not found."));
        }

        // if output is SOL -> make the user pay for the token account
        // bc it is going to be closed and the rent claimed right after

        // if you want to change this you'll also want to change the quote code as well
        // here: https://github.com/stealth-projects/movement/blob/f1ff44f15ae0935bbb9becc9ec8cc2da1772b744/server/src/modules/trading/services/tradingProviders/jupiter.ts#L62
        // in the tradingProviders > jupiter file to make these people send us money for the fees
        const payer =
            isSOLOutput || isSOLInput
                ? new PublicKey(walletPublicKey)
                : mvmtFeePayer.publicKey;

        const associatedTokenAccount =
            createAssociatedTokenAccountIdempotentInstruction(
                payer,
                new PublicKey(outputTokenAccountPubKey),
                new PublicKey(walletPublicKey),
                new PublicKey(outputMint),
                new PublicKey(outputTokenProgramId)
            );

        instructions.push(associatedTokenAccount);

        // close the account to unwrap it (and transfer it all back to the user)
        if (isSOLOutput) {
            const closeAccountInstruction = createCloseAccountInstruction(
                new PublicKey(outputTokenAccountPubKey),
                new PublicKey(walletPublicKey),
                new PublicKey(walletPublicKey),
                [],
                new PublicKey(outputTokenProgramId)
            );

            closeInstructions.push(closeAccountInstruction);
        }
    }

    // if there is an output token account and the mint is SOL, just go ahead and unwrap it
    if (hasTokenAccountForOutput && outputMint === WRAPPED_SOL_MINT) {
        console.log(`[unwrapping existing sol account]`);

        if (!outputTokenAccountPubKey || !outputTokenProgramId) {
            return failure(new Error("Output token account not found."));
        }

        const closeAccountInstruction = createCloseAccountInstruction(
            new PublicKey(outputTokenAccountPubKey),
            new PublicKey(walletPublicKey),
            new PublicKey(walletPublicKey),
            [],
            new PublicKey(outputTokenProgramId)
        );

        closeInstructions.push(closeAccountInstruction);
    }

    // order matters here this has to be at the end
    // create temporary wrapped SOL account. we need this for a lot of pump.fun tokens. so cannot just go USDC -> token need this temp wrapped sol account
    if (!hasTokenAccountForWrappedSol && !isSOLInput && !isSOLOutput) {
        if (!wrappedSolTokenAccountPubKey) {
            return failure(new Error("Wrapped SOL token account not found"));
        }

        const associatedTokenAccount =
            createAssociatedTokenAccountIdempotentInstruction(
                mvmtFeePayer.publicKey,
                new PublicKey(wrappedSolTokenAccountPubKey),
                new PublicKey(walletPublicKey),
                new PublicKey(WRAPPED_SOL_MINT),
                new PublicKey(TOKEN_PROGRAM_ID),
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

        const closeAccountInstruction = createCloseAccountInstruction(
            new PublicKey(wrappedSolTokenAccountPubKey),
            mvmtFeePayer.publicKey,
            new PublicKey(walletPublicKey),
            [],
            new PublicKey(TOKEN_PROGRAM_ID)
        );

        instructions.push(...[associatedTokenAccount]);
        closeInstructions.push(closeAccountInstruction);
    }

    // console.log(`[num instructions: ${instructions.length}]`);

    console.timeEnd("has-token-account");

    return success({
        instructions,
        closeInstructions,
    });
};

export const jup = {
    quotes: { get: getQuoteV2WithRetry },
    swap: {
        //buildTransaction,
        buildTransactionV2: buildTransactionWrapperV2,
    },
    prices: { get: getPriceV2 },
};
