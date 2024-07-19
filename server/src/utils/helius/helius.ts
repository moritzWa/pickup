import {
    Account,
    AccountLayout,
    getAccount,
    getAssociatedTokenAddress,
    getMint as _getMint,
    Mint,
    TokenAccountNotFoundError,
} from "@solana/spl-token";
import {
    AccountInfo,
    Commitment,
    ConfirmedSignatureInfo,
    Connection,
    ParsedTransactionWithMeta,
    PublicKey,
    RpcResponseAndContext,
    TokenAccountBalancePair,
    TransactionConfirmationStatus,
} from "@solana/web3.js";
import axios, { AxiosError } from "axios";
import { chunk, isNil, first } from "lodash";
import {
    fork,
    last,
    map,
    objectify,
    parallel,
    sleep,
    tryit,
    unique,
} from "radash";
import { config } from "src/config";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    hasValue,
    Maybe,
    NotFoundError,
    success,
    UnexpectedError,
} from "src/core/logic";
import {
    HeliusAssetBalance,
    HeliusBalance,
    HeliusNFTMetadata,
    HeliusPriorityFeeLevels,
    HeliusTokenDASMetadata,
    HeliusTokenMetadata,
    HeliusTransaction,
    HeliusTransferType,
    PriorityLevel,
} from "./types";
import { Helius } from "helius-sdk";
import { Helpers, wrapAxiosWithRetry } from "../helpers";
import {
    apiClient,
    connection,
    heliusRpcClient,
    ironForgeConnection,
    rpcClient,
    STAKE_ACCOUNT_PROGRAM_ID,
    TOKEN_ACCOUNT_PROGRAM_ID,
} from "./constants";
import { Slack, SlackChannel } from "../slack";
import objectHash = require("object-hash");
import { Datadog } from "../datadog";
import { trackError } from "../trackDatadog";
import { Tags } from "hot-shots";
import BigNumber from "bignumber.js";
import { SignatureStatus } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import { TransactionStatus } from "src/core/infra/postgres/entities";
import { getAssociatedTokenAccountAddress } from "../solana";
import { redisPersisted } from "../cache";

// sometimes helius just cannot pull a txn. we will log this to slack, but it will just fail the entire import
// so it is a bad UX experience. this way we at least keep the import going. not the ideal solution,
// but it can happen although rare
const MAX_ALLOWED_MISSING_TXNS = 3;

type GetTransactionParams = {
    before?: string; // sig
    until?: string; // sig
    limit?: number;
};

export type SolanaParsedTransaction = ParsedTransactionWithMeta & {
    signature: string;
};

const getNFTMetadata = async (
    addresses: string[]
): Promise<FailureOrSuccess<DefaultErrors, HeliusNFTMetadata[]>> => {
    try {
        const response = await apiClient.post<HeliusNFTMetadata[]>(
            `/v0/tokens/metadata`,
            {
                mintAccounts: addresses,
            }
        );

        return success(response.data);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getTokenMetadata = async (
    addresses: string[]
): Promise<FailureOrSuccess<DefaultErrors, HeliusTokenMetadata[]>> => {
    try {
        const chunksOf100 = chunk(addresses, 100);

        const responses = await Promise.all(
            chunksOf100.map((c) =>
                apiClient.post<HeliusTokenMetadata[]>(`/v0/token-metadata`, {
                    mintAccounts: c,
                    includeOffChain: true,
                })
            )
        );

        return success(responses.flatMap((r) => r.data));
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getTransactions = async (
    walletAddress: string,
    beforeTransactionSignature: Maybe<string>
): Promise<FailureOrSuccess<DefaultErrors, HeliusTransaction[]>> => {
    try {
        const response = await apiClient.get<HeliusTransaction[]>(
            `/v0/addresses/${walletAddress}/transactions`,
            Helpers.stripUndefined({
                before: beforeTransactionSignature ?? undefined,
            })
        );

        return success(response.data);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getTokenMetadataViaDAS = async (
    mints: string[]
): Promise<FailureOrSuccess<DefaultErrors, HeliusTokenDASMetadata[]>> => {
    if (mints.length === 0) return success([]);

    try {
        const chunksOf1000 = chunk(mints, 1000);

        const responses = await map(chunksOf1000, (ids) =>
            heliusRpcClient.post<{
                result: HeliusTokenDASMetadata[];
            }>(
                "/",
                JSON.stringify({
                    jsonrpc: "2.0",
                    id: "awaken",
                    method: "getAssetBatch",
                    params: {
                        ids: ids,
                        displayOptions: {
                            showCollectionMetadata: true,
                            showFungible: true,
                        },
                    },
                })
            )
        );

        const tokens = responses.flatMap((r) => r.data.result);

        return success(tokens);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getSingleTokenMetadataViaDAS = async (
    mint: string
): Promise<FailureOrSuccess<DefaultErrors, HeliusTokenDASMetadata>> => {
    try {
        const response = await heliusRpcClient.post<{
            result: HeliusTokenDASMetadata;
        }>(
            "/",
            JSON.stringify({
                jsonrpc: "2.0",
                id: "awaken",
                method: "getAsset",
                params: {
                    id: mint,
                    displayOptions: {
                        showFungible: true, //return details about a fungible token
                    },
                },
            })
        );

        return success(response.data.result);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getTransactionsBySignatures = async (
    signatures: string[],
    retryCount = 5,
    delay = 1000
): Promise<FailureOrSuccess<DefaultErrors, HeliusTransaction[]>> => {
    const accumulatedTxns: HeliusTransaction[] = [];

    const retryGetTransactions = async (
        signatures: string[],
        retriesLeft: number,
        currentDelay: number
    ): Promise<void> => {
        if (retriesLeft <= 0) {
            return;
        }

        try {
            const response = await apiClient.post<HeliusTransaction[]>(
                `/v0/transactions`,
                { transactions: signatures }
            );

            const txns = response.data;
            accumulatedTxns.push(...txns); // Accumulate retrieved transactions

            // Find the missing transaction signatures
            const sigs = new Set<string>(
                accumulatedTxns.map((t) => t.signature)
            );
            const missingSignatures = signatures.filter((s) => !sigs.has(s));

            if (missingSignatures.length > 0) {
                // console.log(
                //     `[missing ${missingSignatures.length} txns] Retrying...`
                // );
                // console.log(missingSignatures.join(", "));
                await new Promise((resolve) =>
                    setTimeout(resolve, currentDelay)
                );
                await retryGetTransactions(
                    missingSignatures,
                    retriesLeft - 1,
                    currentDelay * 2
                );
            }
        } catch (err) {
            debugger;
            console.log(`Error: ${(err as Error).message}. Retrying...`);
            await new Promise((resolve) => setTimeout(resolve, currentDelay));
            await retryGetTransactions(
                signatures,
                retriesLeft - 1,
                currentDelay * 2
            );
        }
    };

    await retryGetTransactions(signatures, retryCount, delay);

    const successFormattedTxns = accumulatedTxns.map((t) => ({
        ...t,
        nativeTransfers: t.nativeTransfers.map((n) => ({
            ...n,
            mint: "So11111111111111111111111111111111111111112",
        })),
        tokenTransfers: t.tokenTransfers.map((t) => ({
            ...t,
            amount: t.tokenAmount,
        })),
    }));

    const formattedTxns: HeliusTransaction[] = [...successFormattedTxns];

    // if this happens -> don't just error. still succeed the import. we need some way tho of
    // setting something on the account to know it didn't fully work. right now this just fks the whole
    // import though if we are missing let's say one txn
    if (formattedTxns.length !== signatures.length) {
        const sigs = new Set<string>(accumulatedTxns.map((t) => t.signature));
        const diff = signatures.filter((s) => !sigs.has(s));

        // console.log(`[missing ${diff.length} txns]`);

        const traceId = uuidv4();

        // console.log("TRACE: ", traceId);
        // console.log(diff);

        _recordTxnErr({});

        // if over the tolerance -> fail loudly
        if (diff.length > MAX_ALLOWED_MISSING_TXNS) {
            return failure(
                new UnexpectedError(
                    `Missing ${diff.length} txns. Max allowed is ${MAX_ALLOWED_MISSING_TXNS}`
                )
            );
        }

        // console.log(
        //     `[continuing anyways bc only ${diff.length} txns are missing]`
        // );

        // otherwise keep going so at least we can import
        return success(formattedTxns);
    }

    // console.log(`[success ${hash}]`);

    _recordTxnOk({});

    return success(formattedTxns);
};

const getTransactionsBySignature = async (
    sig: string
): Promise<FailureOrSuccess<DefaultErrors, HeliusTransaction>> => {
    try {
        const response = await apiClient.post<HeliusTransaction[]>(
            `/v0/transactions`,
            { transactions: [sig] }
        );

        const txn = response.data[0];

        if (!txn) {
            return failure(new NotFoundError("Transaction not found"));
        }

        return success({
            ...txn,
            nativeTransfers: txn.nativeTransfers.map((n) => ({
                ...n,
                // same here, this lets us link the native token transfers to token transfers
                mint: "So11111111111111111111111111111111111111112",
            })),
            // Note: we do this so outside code is easier to write bc the native + token transfers
            // have similar types
            tokenTransfers: txn.tokenTransfers.map((t) => ({
                ...t,
                amount: t.tokenAmount,
            })),
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getTransaction = async (
    sig: string
): Promise<
    FailureOrSuccess<DefaultErrors, ParsedTransactionWithMeta | null>
> => {
    try {
        // get solana txn
        const solanaTxn = await connection.getParsedTransaction(sig, {
            maxSupportedTransactionVersion: 0,
        });

        return success(solanaTxn);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getAccountInfo = async (
    accountPubKey: string,
    encoding?: string
): Promise<FailureOrSuccess<DefaultErrors, any>> => {
    try {
        const data = JSON.stringify({
            jsonrpc: "2.0",
            id: "awaken",
            method: "getAccountInfo",
            params: [
                accountPubKey,
                {
                    encoding: encoding || "base58",
                },
            ],
        });

        const result = await rpcClient.post("/", data, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        return success(result.data);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getTransactionSignatures = async (
    accountPubKey: string,
    untilSlot: Maybe<string>
): Promise<FailureOrSuccess<DefaultErrors, ConfirmedSignatureInfo[]>> => {
    try {
        let hasMore = true;
        let txns: ConfirmedSignatureInfo[] = [];

        // console.time("getTransactionSignatures-" + accountPubKey);
        while (hasMore) {
            const before = last(txns)?.signature || null;
            const params = [
                accountPubKey,
                Helpers.stripUndefined({
                    limit: 1000,
                    before: !isNil(before) ? before : undefined,
                }),
            ];

            const data = JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getSignaturesForAddress",
                params: params,
            });

            const result = await rpcClient.post<{
                result: ConfirmedSignatureInfo[];
            }>("/", data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const solanaTxns = result.data.result || [];

            if (untilSlot) {
                // oldest txn
                const [txnsBeforeSlot, txnsAfterSlot] = fork(
                    solanaTxns,
                    (t) => t.slot <= parseInt(untilSlot)
                );

                txns.push(...txnsAfterSlot);

                // if there are txns before the desired slot, we're done
                if (txnsBeforeSlot.length) {
                    hasMore = false;
                    break;
                }
            }

            txns.push(...solanaTxns);
            hasMore = solanaTxns.length === 1000;
        }
        // console.timeEnd("getTransactionSignatures-" + accountPubKey);

        Datadog.increment("helius.txn_signatures.ok", 1);

        return success(txns);
    } catch (err) {
        Datadog.increment("helius.txn_signatures.err", 1);

        return failure(
            new UnexpectedError(err, {
                accountPubKey,
            })
        );
    }
};

const getParsedTransactions = async (
    signatures: string[]
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        (ParsedTransactionWithMeta & { signature: string })[]
    >
> => {
    try {
        // get the transactions for these signatures
        const txns = await connection.getParsedTransactions(signatures, {
            maxSupportedTransactionVersion: 0,
        });

        const values = txns.filter(hasValue);

        if (values.length !== signatures.length) {
            return failure(
                new NotFoundError(
                    "Some of the transactions do not exist.",
                    null,
                    {
                        txns,
                        signatures,
                    }
                )
            );
        }

        Datadog.increment("helius.solana.get_parsed_txns.ok", 1);

        return success(
            values.map((v, i) => ({
                ...v,
                signature: signatures[i],
            }))
        );
    } catch (err) {
        Datadog.increment("helius.solana.get_parsed_txns.err", 1);

        return failure(
            new UnexpectedError(err, {
                signatures,
            })
        );
    }
};

export type SolanaSigAndStatus = {
    signature: string;
    status: "failed" | TransactionConfirmationStatus | null;
};

const getTransactionStatuses = async (
    accountPubKey: string,
    allSignatures: string[]
): Promise<FailureOrSuccess<DefaultErrors, SolanaSigAndStatus[]>> => {
    try {
        // console.time("getTransactionSignatures-" + accountPubKey);
        const chunks = chunk(allSignatures, 200);
        const statuses: SolanaSigAndStatus[] = [];

        for (const sigs of chunks) {
            const statusResponses = await connection.getSignatureStatuses(
                sigs,
                {
                    searchTransactionHistory: true,
                }
            );

            const chunkStatuses = (statusResponses.value || [])
                .map((s, i): Maybe<SolanaSigAndStatus> => {
                    if (!s) return null;

                    return {
                        status: !isNil(s.err)
                            ? "failed"
                            : s.confirmationStatus ?? null,
                        signature: sigs[i],
                    };
                })
                .filter(hasValue);

            statuses.push(...chunkStatuses);
        }

        // console.timeEnd("getTransactionSignatures-" + accountPubKey);

        Datadog.increment("helius.get_statuses.ok", 1);

        return success(statuses);
    } catch (err) {
        Datadog.increment("helius.get_statuses.err", 1);

        return failure(
            new UnexpectedError(err, {
                accountPubKey,
            })
        );
    }
};

const getTokenAccountPubKeysForAddress = async (
    accountPubKey: string,
    mints: string[]
): Promise<FailureOrSuccess<DefaultErrors, string[]>> => {
    try {
        const tokenAccounts = await connection.getTokenAccountsByOwner(
            new PublicKey(accountPubKey),
            {
                programId: new PublicKey(TOKEN_ACCOUNT_PROGRAM_ID),
            }
        );

        const liveTokenAccounts = tokenAccounts.value.map((v) =>
            v.pubkey.toBase58()
        );

        // token: Gnuxzdfd2ewx2mLsKcvDcxPhFvUmPoEN7UVuvzakQsVQ
        // token account: 98BbawBUaZSAfLsedX57dHSTL3fK4DWQueuFE9fDPaiG
        const allDerivedTokenAccounts = await Promise.all(
            mints.map((m) =>
                getAssociatedTokenAddress(
                    new PublicKey(m),
                    new PublicKey(accountPubKey)
                )
            )
        );

        return success(
            unique([
                ...liveTokenAccounts,
                ...allDerivedTokenAccounts.map((a) => a.toBase58()),
            ])
        );
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getSignaturesForMint = async (
    address: string,
    mint: string,
    untilSlot: Maybe<string>
): Promise<FailureOrSuccess<DefaultErrors, string[]>> => {
    const tokenAccountPubKey = await getAssociatedTokenAddress(
        new PublicKey(mint),
        new PublicKey(address)
    );

    const signaturesResponse = await getTransactionSignatures(
        tokenAccountPubKey.toBase58(),
        untilSlot
    );

    if (signaturesResponse.isFailure()) {
        return failure(signaturesResponse.error);
    }

    const sigs = signaturesResponse.value;

    return success(sigs.map((s) => s.signature));
};

const getMint = async (
    pubkey: string
): Promise<FailureOrSuccess<DefaultErrors, Mint>> => {
    try {
        return success(
            await _getMint(connection, new PublicKey(pubkey), "finalized")
        );
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getLiveTokenAccountsForAddress = async (
    accountPubKey: string
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            tokenAccountAddress: string;
            mintAddress: string;
        }[]
    >
> => {
    try {
        const tokenAccounts = await connection.getTokenAccountsByOwner(
            new PublicKey(accountPubKey),
            {
                programId: new PublicKey(TOKEN_ACCOUNT_PROGRAM_ID),
            }
        );

        const tokenAccountWithMints = tokenAccounts.value.map((t) => {
            const tokenAccountData = AccountLayout.decode(t.account.data);
            return {
                tokenAccountAddress: t.pubkey.toBase58(),
                mintAddress: tokenAccountData.mint.toBase58(),
            };
        });

        Datadog.increment("helius.token_accounts.ok", 1);

        return success(tokenAccountWithMints);
    } catch (err) {
        Datadog.increment("helius.token_accounts.err", 1);

        return failure(new UnexpectedError(err));
    }
};

const _toSOLTxns = (
    sigChunk: string[],
    solanaTxns: Maybe<ParsedTransactionWithMeta>[]
): SolanaParsedTransaction[] =>
    solanaTxns
        .map((t, i) => ({
            txn: t,
            signature: sigChunk[i],
        }))
        .filter((t) => !isNil(t.txn))
        .map(
            (t): SolanaParsedTransaction => ({
                ...t.txn!,
                signature: t.signature,
            })
        );

const getBlockBySignature = async (
    signature: string
): Promise<FailureOrSuccess<DefaultErrors, Maybe<number>>> => {
    try {
        const response = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!response) {
            return failure(new UnexpectedError("No block found"));
        }

        return success(response.blockTime ?? null);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
};

const getEpochBySignature = async (
    signature: string
): Promise<FailureOrSuccess<DefaultErrors, number>> => {
    try {
        const response = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!response) {
            return failure(new UnexpectedError("No block found"));
        }

        return success(response.slot);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
};

const getAddressBalances = async (
    address: string
): Promise<FailureOrSuccess<DefaultErrors, HeliusBalance>> => {
    try {
        const response = await apiClient.get<HeliusBalance>(
            `/v0/addresses/${address}/balances`
        );

        Datadog.increment("helius.balances.ok", 1);

        return success(response.data);
    } catch (err) {
        Datadog.increment("helius.balances.err", 1);
        return failure(new UnexpectedError(err));
    }
};

const _recordTxnOk = (tags: Tags) =>
    Datadog.increment("helius.transactions.ok", 1, tags);

const _recordTxnErr = (tags: Tags) =>
    trackError("helius.transactions.err", 1)(tags);

const getAssets = async (
    address: string,
    page: number,
    limit: number
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            balances: HeliusAssetBalance[];
            total: number;
        }
    >
> => {
    try {
        const data = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "searchAssets", // "getAssetsByOwner",
            params: {
                ownerAddress: address,
                page: page,
                limit: limit,
                tokenType: "fungible",
                // displayOptions: {
                //     showFungible: true, //return both fungible and non-fungible tokens
                // },
            },
        });

        const result = await rpcClient.post("/", data, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        const tokens = result.data.result;

        Datadog.increment("helius.assets_search.ok", 1);

        return success({
            balances: tokens.items,
            total: tokens.total,
        });
    } catch (err) {
        Datadog.increment("helius.assets_search.err", 1);
        return failure(new UnexpectedError(err));
    }
};

const getAllAssets = async (
    address: string
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        { balances: HeliusAssetBalance[]; nativeBalance: BigNumber }
    >
> => {
    try {
        let hasMore = true;
        let page = 1;
        const limit = 1000;
        const tokens: HeliusAssetBalance[] = [];

        const nativeBalance = await connection.getBalance(
            new PublicKey(address)
        );

        while (hasMore) {
            const response = await getAssets(address, page, limit);
            if (response.isFailure()) return failure(response.error);

            const { balances, total } = response.value;

            tokens.push(...balances);
            hasMore = total === limit;
            page++;
        }

        return success({
            balances: tokens,
            nativeBalance: new BigNumber(nativeBalance).div(
                new BigNumber(10).pow(9)
            ),
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getNativeSolanaBalance = async (
    address: string
): Promise<FailureOrSuccess<DefaultErrors, BigNumber>> => {
    try {
        const balance = await connection.getBalance(new PublicKey(address));

        return success(new BigNumber(balance).div(new BigNumber(10).pow(9)));
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getStatus = async (
    connection: Connection,
    tx: string
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        Maybe<{
            info: SignatureStatus;
            status: TransactionStatus;
        }>
    >
> => {
    try {
        const result = await connection.getSignatureStatus(tx, {
            searchTransactionHistory: true,
        });
        if (!result.value) {
            return success(null);
        }
        return success({
            info: result.value,
            status: !isNil(result.value.err)
                ? TransactionStatus.Failed
                : result.value.confirmationStatus === "confirmed"
                ? TransactionStatus.Confirmed
                : result.value.confirmationStatus === "finalized"
                ? TransactionStatus.Finalized
                : result.value.confirmationStatus === "processed"
                ? TransactionStatus.Processed
                : TransactionStatus.Pending,
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getCurrentBlockHash = async (
    commitment?: Commitment
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        Readonly<{
            blockhash: string;
            lastValidBlockHeight: number;
        }>
    >
> => {
    try {
        const result = await connection.getLatestBlockhash(commitment);
        return success(result);
    } catch (err) {
        // retry again real quick
        await sleep(100);
        const res = await getCurrentBlockHash();
        if (res.isSuccess()) return res;
        return failure(new UnexpectedError(err));
    }
};

const getTokenLargestAccounts = async (
    mintAddress: string
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        RpcResponseAndContext<TokenAccountBalancePair[]>
    >
> => {
    // DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
    try {
        const result = await connection.getTokenLargestAccounts(
            new PublicKey(mintAddress)
        );
        return success(result);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getPriorityFeeEstimate = async (
    priorityLevel: PriorityLevel,
    transactionBase58: string
): Promise<FailureOrSuccess<DefaultErrors, number>> => {
    try {
        const data = JSON.stringify({
            jsonrpc: "2.0",
            id: "awaken",
            method: "getPriorityFeeEstimate",
            params: [
                {
                    transaction: transactionBase58, // Pass the serialized transaction in Base58
                    options: { priority_level: priorityLevel },
                },
            ],
        });

        const result = await rpcClient.post("/", data, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        return success(result.data);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getPriorityFeeEstimateForJupiter =
    async (): // priorityLevel: PriorityLevel
    Promise<FailureOrSuccess<DefaultErrors, HeliusPriorityFeeLevels>> => {
        try {
            const data = JSON.stringify({
                jsonrpc: "2.0",
                id: "awaken",
                method: "getPriorityFeeEstimate",
                params: [
                    {
                        accountKeys: [
                            "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
                        ],
                        options: {
                            // priority_level: priorityLevel,
                            includeAllPriorityFeeLevels: true,
                        },
                    },
                ],
            });

            const result = await rpcClient.post<{
                result: { priorityFeeLevels: HeliusPriorityFeeLevels };
            }>("/", data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const priorityFeeLevels = result.data.result.priorityFeeLevels;

            return success(priorityFeeLevels);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

const getPriorityFeeEstimateGlobal = async (
    priorityLevel: PriorityLevel
): Promise<FailureOrSuccess<DefaultErrors, HeliusPriorityFeeLevels>> => {
    try {
        const data = JSON.stringify({
            jsonrpc: "2.0",
            id: "awaken",
            method: "getPriorityFeeEstimate",
            params: [
                {
                    options: {
                        priority_level: priorityLevel,
                        includeAllPriorityFeeLevels: true,
                    },
                },
            ],
        });

        const result = await rpcClient.post<{
            result: { priorityFeeLevels: HeliusPriorityFeeLevels };
        }>("/", data, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        const priorityFeeLevels = result.data.result.priorityFeeLevels;

        return success(priorityFeeLevels);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const getTokenAccount = async (
    associatedTokenAccount: string,
    tokenProgramId: string
): Promise<FailureOrSuccess<DefaultErrors, Account>> => {
    try {
        const tokenAccount = await getAccount(
            connection,
            new PublicKey(associatedTokenAccount),
            undefined,
            new PublicKey(tokenProgramId)
        );
        if (!tokenAccount) {
            return failure(new NotFoundError("Token account not found"));
        }
        return success(tokenAccount);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const getHeliusCDNUrl = (
    tokenInfo: HeliusTokenDASMetadata | null
): string | null => {
    if (!tokenInfo) return null;
    const cdnUrl = (tokenInfo.content.files || [])[0]?.cdn_uri || null;
    if (cdnUrl) return cdnUrl;
    // otherwise try to get the .uri
    const uri = (tokenInfo.content.files || [])[0]?.uri || null;
    if (uri) return uri;
    return null;
};

const hasTokenAccount = async ({
    walletAddress,
    mintAddress: mint,
    tokenProgramId: _tokenProgramId,
}: {
    walletAddress: string;
    mintAddress: string;
    tokenProgramId?: string;
}): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            hasTokenAccount: boolean;
            tokenAccountPubKey: Maybe<string>;
            account: Maybe<Account>;
            tokenProgramId: Maybe<string>;
        }
    >
> => {
    // console.log("finding has token account");
    const mintAddress = new PublicKey(mint);

    let tokenProgramId = _tokenProgramId
        ? new PublicKey(_tokenProgramId)
        : null;

    if (!tokenProgramId) {
        try {
            // try to get it from redis. if not look it up
            const key = `tpid-${mintAddress.toBase58()}`;

            const cachedTokenProgramId = await redisPersisted.get(
                `tpid-${mintAddress.toBase58()}`
            );

            if (cachedTokenProgramId) {
                tokenProgramId = new PublicKey(cachedTokenProgramId);
            } else {
                const tokenResponse = await helius.tokens.metadataV2(mint);

                if (tokenResponse.isFailure()) {
                    return failure(tokenResponse.error);
                }

                const token = tokenResponse.value;

                tokenProgramId = new PublicKey(token.token_info.token_program);

                await redisPersisted.set(key, tokenProgramId.toBase58());
            }
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    const associatedTokenAccount = getAssociatedTokenAccountAddress(
        new PublicKey(mintAddress),
        new PublicKey(walletAddress),
        tokenProgramId
    );

    try {
        // see if the to address has an associated account, if not we need to make it
        // so we can send the user the tokens in the first place
        const tokenAccount = await getAccount(
            connection,
            new PublicKey(associatedTokenAccount),
            undefined,
            tokenProgramId
        );

        return success({
            hasTokenAccount: !!tokenAccount,
            tokenAccountPubKey: associatedTokenAccount.toBase58(),
            account: tokenAccount,
            tokenProgramId: tokenProgramId.toBase58(),
        });
    } catch (err) {
        if (err instanceof TokenAccountNotFoundError) {
            return success({
                hasTokenAccount: false,
                tokenAccountPubKey: associatedTokenAccount.toBase58(),
                account: null,
                tokenProgramId: tokenProgramId.toBase58(),
            });
        }

        return failure(new UnexpectedError(err));
    }
};

const isReceived = async (
    signature: string
): Promise<FailureOrSuccess<DefaultErrors, TransactionConfirmationStatus>> => {
    try {
        const status = await connection.getSignatureStatus(signature);

        if (!status.value) {
            return failure(
                new UnexpectedError("No status found for transaction.")
            );
        }

        if (!status.value.confirmationStatus) {
            return failure(
                new UnexpectedError(
                    "No confirmation status found for transaction."
                )
            );
        }

        return success(status.value.confirmationStatus);
    } catch (err) {
        console.log(err);
        return failure(new UnexpectedError(err));
    }
};

export const helius = {
    blocks: { current: getCurrentBlockHash },
    mint: {
        getMint,
    },
    // technically a wallet is an account, but just to be a lil more readable gonna keep separate for the balances calls
    wallets: {
        getSolanaBalance: getNativeSolanaBalance,
        // old -> IDK if this is even useful
        _balances: getAddressBalances,
        allBalances: getAllAssets,
        hasTokenAccount,
    },
    accounts: {
        getInfo: getAccountInfo,
        getTokenAccountPubKeys: getTokenAccountPubKeysForAddress,
        getLiveTokenAccountsForAddress,
        getAllSignatures: getTransactionSignatures,
        getSignaturesForMint,
    },
    transactions: {
        list: getTransactions,
        forSignatures: getTransactionsBySignatures,
        findBySignature: getTransactionsBySignature,
        getRawTransaction: getTransaction,
        getBlockBySignature,
        getTransactionStatuses,
        getEpochBySignature,
        getStatus,
        isReceived,
    },
    nfts: { metadata: getNFTMetadata },
    fees: {
        globalPriorityFee: getPriorityFeeEstimateGlobal,
        priorityFee: getPriorityFeeEstimate,
        priorityForJupiter: getPriorityFeeEstimateForJupiter,
    },
    tokens: {
        metadataV2: getSingleTokenMetadataViaDAS,
        metadata: getTokenMetadata,
        metadataDAS: getTokenMetadataViaDAS,
        getTokenAccount: getTokenAccount,
        getTokenLargestAccounts,
    },
};
