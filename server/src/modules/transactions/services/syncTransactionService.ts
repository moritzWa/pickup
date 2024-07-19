import {
    AccountProvider,
    Swap,
    Transfer,
    User,
} from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { MagicPortfolioService } from "src/modules/portfolio/services/portfolioService/magicPortfolioService";
import { transactionRepo } from "../infra";
import { TxnUpsertInfo } from "../infra/transactionRepo";
import { v4 as uuidv4 } from "uuid";
import { PusherEventName, pusher } from "src/utils/pusher";
import { connect } from "src/core/infra/postgres";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { SolanaTradingService } from "src/shared/integrations/providers/solana";
import { getWalletTypeForMagic, magic } from "src/utils/magic";
import {
    swapEventRepo,
    swapFeeRepo,
    swapRepo,
} from "src/modules/trading/infra/postgres";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { Datadog, Slack, SlackChannel } from "src/utils";
import { BlockExplorerService } from "src/shared/blockExplorerService/blockExplorerService";
import { keyBy } from "lodash";
import { SwapStatusService } from "src/modules/trading/services/swapService/swapStatusService";
import { referralCommissionRepo } from "src/modules/referral/infra";
import { withdrawalRepo } from "src/modules/transfers/infra";
import { WithdrawalStatusService } from "src/modules/transfers/services/syncWithdrawalService";
import { WithdrawalStatus } from "src/core/infra/postgres/entities/Withdrawal";

const syncTransactions = async (user: User) => {
    try {
        const currentTransactionHashesResponse =
            await transactionRepo.findForUser(user.id, {
                select: { hash: true, transfers: { id: true } },
                relations: { transfers: true },
            });

        if (currentTransactionHashesResponse.isFailure()) {
            return failure(currentTransactionHashesResponse.error);
        }

        const currentTxnsByHash = keyBy(
            currentTransactionHashesResponse.value,
            (t) => t.hash
        );

        const txnsResponse = await MagicPortfolioService.getFullTransactions(
            user.magicIssuer
        );

        if (txnsResponse.isFailure()) {
            return failure(txnsResponse.error);
        }

        const txns = txnsResponse.value;
        const newTxns = txns.filter((t) => {
            const currentTxn = currentTxnsByHash[t.hash];

            // some difference between the txns
            return (
                !currentTxnsByHash[t.hash] ||
                currentTxn?.transfers?.length !== t.transfers.length
            );
        });

        const params = newTxns.map((t): TxnUpsertInfo => {
            const id = uuidv4();
            const txn = { ...t, id, updatedAt: new Date(), userId: user.id };

            return {
                txn,
                transfers: t.transfers.map((tr) => ({
                    id: uuidv4(),
                    userId: user.id,
                    transactionId: id,
                    symbol: tr.symbol || "",
                    amount: tr.amount,
                    type: tr.type,
                    fiatAmountCents: null,
                    hasLookedUpFiatAmount: false,
                    tokenContractAddress: tr.contractAddress,
                    tokenIdentifier: `${tr.provider}:${tr.contractAddress}`,
                    decimals: tr.decimals || 0,
                    from: tr.from || "",
                    to: tr.to || "",
                    provider: t.provider,
                    iconImageUrl: tr.iconImageUrl || "",
                    createdAt: t.createdAt,
                    updatedAt: new Date(),
                })),
            };
        });

        if (params.length > 0) {
            const upsertResponse = await transactionRepo.upsert(params);

            if (upsertResponse.isFailure()) {
                return failure(upsertResponse.error);
            }

            // emit an event so frontend can listen
            await pusher.trigger(
                `user-${user.id}`,
                PusherEventName.TransactionsInserted,
                {
                    hashes: newTxns.map((t) => t.hash),
                }
            );

            // reset the cache
            await MagicPortfolioService.getFullPositionsFromMagicAndSetCache(
                user
            );
        }

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const syncTransactionForSwap = async (
    swapId: string
): Promise<FailureOrSuccess<DefaultErrors, Maybe<any>>> => {
    try {
        const swapResponse = await swapRepo.findById(swapId, {
            relations: {
                user: true,
            },
        });

        if (swapResponse.isFailure()) {
            return failure(swapResponse.error);
        }

        const swap = swapResponse.value;
        const user = swap.user;

        console.log(`[syncing txn ${swap.hash} on ${swap.provider}]`);

        const existsResponse = await transactionRepo.existsForHash(
            user.id,
            swap.hash,
            swap.chain
        );

        if (existsResponse.isFailure()) {
            return failure(existsResponse.error);
        }

        const exists = existsResponse.value;

        if (exists) {
            return success(null);
        }

        if (swap.chain === AccountProvider.Solana) {
            const walletType = getWalletTypeForMagic(swap.chain);

            const walletResponse = await magic.wallets.getPublicAddress(
                user.magicIssuer,
                walletType
            );

            if (walletResponse.isFailure()) {
                return failure(walletResponse.error);
            }

            const pubKey = walletResponse.value?.publicAddress;

            if (!pubKey) {
                return failure(new Error("Could not find the wallet."));
            }

            const statusResponse = await SwapStatusService.getStatus(swap);

            if (statusResponse.isFailure()) {
                return failure(statusResponse.error);
            }

            const { status, failedReason } = statusResponse.value;

            // create the swap event
            const response = await swapEventRepo.create({
                isTimedOut: false,
                status: status,
                hash: swap.hash,
                id: uuidv4(),
                chain: swap.chain,
                durationSeconds: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: swap.userId,
            });

            if (response.isSuccess()) {
                Datadog.increment("trading.swaps.status", {
                    status: status,
                });
            }

            console.log(
                `[updating swap ${swap.hash} to ${status}. failed: ${
                    failedReason || "none"
                }]`
            );

            await swapRepo.update(swap.id, {
                status: status,
                failedReason,
            });

            if (status === SwapStatus.Failed) {
                await referralCommissionRepo.deleteForSwap(swapId);
                await swapFeeRepo.deleteForSwap(swapId);
            }

            if (status === SwapStatus.Failed) {
                void Slack.send({
                    channel: SlackChannel.Swaps,
                    format: true,
                    message: [
                        `🔴 Swap failed by ${user.email} (${user.id})\n`,
                        `Hash: ${swap.hash} (${swap.chain})`,
                        `Tokens: ${swap.sendSymbol} -> ${swap.receiveSymbol}`,
                        `Block Explorer: ${
                            BlockExplorerService.getBlockExplorerInfo(
                                swap.chain,
                                swap.hash
                            )?.url || ""
                        } `,
                    ].join("\n"),
                });

                // TODO: for now we don't store failed txns bc they are not even parsed by helius into something that is easy for us to store
                return success(null);
            }

            const newTxnResponse = await SolanaTradingService.getTransaction({
                hash: swap.hash,
                walletAddress: pubKey,
            });

            if (newTxnResponse.isFailure()) {
                console.log("failed to get the txn");
                console.log(newTxnResponse);
                return failure(newTxnResponse.error);
            }

            const newTxn = newTxnResponse.value;
            const id = uuidv4();

            const transfers = newTxn.transfers.map(
                (tr): Omit<Transfer, "transaction" | "user"> => ({
                    id: uuidv4(),
                    userId: user.id,
                    transactionId: id,
                    symbol: tr.symbol || "",
                    amount: tr.amount,
                    type: tr.type,
                    tokenContractAddress: tr.contractAddress,
                    tokenIdentifier: `${tr.provider}:${tr.contractAddress}`,
                    decimals: tr.decimals || 0,
                    fiatAmountCents: null,
                    hasLookedUpFiatAmount: false,
                    from: tr.from || "",
                    to: tr.to || "",
                    provider: newTxn.provider,
                    iconImageUrl: tr.iconImageUrl || "",
                    createdAt: newTxn.createdAt,
                    updatedAt: new Date(),
                })
            );

            const params: TxnUpsertInfo = {
                txn: {
                    ...newTxn,
                    id,
                    createdAt: newTxn.createdAt,
                    updatedAt: new Date(),
                    userId: user.id,
                },
                transfers: transfers, // FIXME: transfers txn status
            };

            const upsertResponse = await transactionRepo.upsert([params]);

            if (upsertResponse.isFailure()) {
                console.log("failed to upsert");
                console.log(upsertResponse);
                return failure(upsertResponse.error);
            }

            // emit an event so frontend can listen
            await pusher.trigger(
                `user-${user.id}`,
                PusherEventName.TransactionsInserted,
                {
                    hashes: [newTxn.hash],
                }
            );

            return success(null);
        }

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const syncTransactionForWithdrawal = async (
    withdrawalId: string
): Promise<FailureOrSuccess<DefaultErrors, Maybe<any>>> => {
    try {
        const withdrawalResponse = await withdrawalRepo.findById(withdrawalId, {
            relations: {
                user: true,
            },
        });

        if (withdrawalResponse.isFailure()) {
            return failure(withdrawalResponse.error);
        }

        const withdrawal = withdrawalResponse.value;
        const user = withdrawal.user;

        console.log(`[syncing txn ${withdrawal.hash} on ${withdrawal.chain}]`);

        const existsResponse = await transactionRepo.existsForHash(
            user.id,
            withdrawal.hash || "",
            withdrawal.chain
        );

        if (existsResponse.isFailure()) {
            return failure(existsResponse.error);
        }

        const exists = existsResponse.value;

        if (exists) {
            return success(null);
        }

        if (withdrawal.chain === AccountProvider.Solana) {
            const walletType = getWalletTypeForMagic(withdrawal.chain);

            const walletResponse = await magic.wallets.getPublicAddress(
                user.magicIssuer,
                walletType
            );

            if (walletResponse.isFailure()) {
                return failure(walletResponse.error);
            }

            const pubKey = walletResponse.value?.publicAddress;

            if (!pubKey) {
                return failure(new Error("Could not find the wallet."));
            }

            const statusResponse = await WithdrawalStatusService.getStatus(
                withdrawal
            );

            if (statusResponse.isFailure()) {
                return failure(statusResponse.error);
            }

            const { status, failedReason } = statusResponse.value;

            console.log(
                `[updating swap ${withdrawal.hash} to ${status}. failed: ${
                    failedReason || "none"
                }]`
            );

            await withdrawalRepo.update(withdrawal.id, {
                status: status,
                failedReason,
            });

            if (status === WithdrawalStatus.Failed) {
                void Slack.send({
                    channel: SlackChannel.Urgent,
                    format: true,
                    message: [
                        `🔴 Swap failed by ${user.email} (${user.id})\n`,
                        `Hash: ${withdrawal.hash} (${withdrawal.chain})`,
                        // `Tokens: ${withdrawal.sendSymbol} -> ${swap.receiveSymbol}`,
                        `Block Explorer: ${
                            BlockExplorerService.getBlockExplorerInfo(
                                withdrawal.chain,
                                withdrawal.hash || ""
                            )?.url || ""
                        } `,
                    ].join("\n"),
                });

                // TODO: for now we don't store failed txns bc they are not even parsed by helius into something that is easy for us to store
                return success(null);
            }

            const newTxnResponse = await SolanaTradingService.getTransaction({
                hash: withdrawal.hash || "",
                walletAddress: pubKey,
            });

            if (newTxnResponse.isFailure()) {
                console.log("failed to get the txn");
                console.log(newTxnResponse);
                return failure(newTxnResponse.error);
            }

            const newTxn = newTxnResponse.value;
            const id = uuidv4();

            const transfers = newTxn.transfers.map(
                (tr): Omit<Transfer, "transaction" | "user"> => ({
                    id: uuidv4(),
                    userId: user.id,
                    transactionId: id,
                    symbol: tr.symbol || "",
                    amount: tr.amount,
                    type: tr.type,
                    tokenContractAddress: tr.contractAddress,
                    tokenIdentifier: `${tr.provider}:${tr.contractAddress}`,
                    decimals: tr.decimals || 0,
                    fiatAmountCents: null,
                    hasLookedUpFiatAmount: false,
                    from: tr.from || "",
                    to: tr.to || "",
                    provider: newTxn.provider,
                    iconImageUrl: tr.iconImageUrl || "",
                    createdAt: newTxn.createdAt,
                    updatedAt: new Date(),
                })
            );

            const params: TxnUpsertInfo = {
                txn: {
                    ...newTxn,
                    id,
                    createdAt: newTxn.createdAt,
                    updatedAt: new Date(),
                    userId: user.id,
                },
                transfers: transfers, // FIXME: transfers txn status
            };

            const upsertResponse = await transactionRepo.upsert([params]);

            if (upsertResponse.isFailure()) {
                console.log("failed to upsert");
                console.log(upsertResponse);
                return failure(upsertResponse.error);
            }

            // emit an event so frontend can listen
            await pusher.trigger(
                `user-${user.id}`,
                PusherEventName.TransactionsInserted,
                {
                    hashes: [newTxn.hash],
                }
            );

            return success(null);
        }

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const SyncTransactionsService = {
    syncTransactions,
    syncTransactionForSwap,
    syncTransactionForWithdrawal,
};

if (require.main === module) {
    connect()
        .then(async () => {
            const userResponse = await pgUserRepo.findByEmail(
                "andrew@movement.market"
            );

            await syncTransactions(userResponse.value);
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
