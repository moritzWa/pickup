import {
    AccountProvider,
    Transaction,
    TransactionType,
    Transfer,
    TransferType,
} from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { transactionRepo } from "src/modules/transactions/infra";
import { TokenPosition } from "src/shared/integrations/types";
import BigNumber from "bignumber.js";
import { fork } from "radash";
import { ZERO, ZERO_BN, sumBigNumbers } from "src/utils";
import { connect } from "src/core/infra/postgres";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { STABLE_COIN_IDENTIFIERS } from "src/shared/domain/stablecoins";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { groupBy, isNil } from "lodash";
import { WRAPPED_SOL_MINT } from "src/shared/integrations/providers/solana/constants";
import { SyncTransactionFiatAmountsService } from "src/modules/transactions/services/syncTransactionFiatAmountsService";

const LIQUID_TOKEN_IDENTIFIERS = new Set<string>([
    `${AccountProvider.Solana}:${WRAPPED_SOL_MINT}`,
]);

export type CostBasisData = {
    averagePurchasePriceCents: Maybe<BigNumber>;
    currentCostBasisCents: Maybe<BigNumber>;
    currentBalance: Maybe<BigNumber>;
    isStableCoin: boolean;
    hasDeposits: boolean;
};

export const getCostBasis = async (
    userId: string,
    token: { contractAddress: string; provider: AccountProvider }
): Promise<FailureOrSuccess<DefaultErrors, CostBasisData>> => {
    try {
        // FIXME: a lil janky
        const isStable = STABLE_COIN_IDENTIFIERS.has(
            `${token.provider}:${token.contractAddress}`
        );

        const transactionsResponse = await transactionRepo.findForUserForToken(
            userId,
            token.contractAddress,
            token.provider,
            {
                skip: 0,
                take: 0,
                order: {
                    createdAt: "asc",
                },
            }
        );

        // take all
        if (transactionsResponse.isFailure()) {
            return failure(transactionsResponse.error);
        }

        const _txns = transactionsResponse.value;

        const syncedTransactionsResponse =
            await SyncTransactionFiatAmountsService.syncAllTransactions(_txns);

        if (syncedTransactionsResponse.isFailure()) {
            return failure(syncedTransactionsResponse.error);
        }

        const txns = syncedTransactionsResponse.value;

        let currentBalance = new BigNumber(0);
        let currentCostBasisFiatAmountCents = new BigNumber(0);
        let hasDeposits = false;

        // Iterate through transactions to calculate total cost and total tokens received
        for (const _txn of txns) {
            if (_txn.type === TransactionType.Deposit) {
                hasDeposits = true;
            }

            const transfers = await _balanceTransfers(_txn);

            const transfersForToken = transfers.filter(
                _isTransferForToken(token)
            );

            // which was sent and which was received
            for (const transfer of transfersForToken) {
                const amount = transfer.amount;
                const fiatAmountCents = transfer.fiatAmountCents ?? 0;

                if (transfer.type === TransferType.Received) {
                    currentBalance = currentBalance.plus(amount);
                    currentCostBasisFiatAmountCents =
                        currentCostBasisFiatAmountCents.plus(fiatAmountCents);
                } else if (transfer.type === TransferType.Sent) {
                    currentBalance = currentBalance.minus(amount);
                    currentCostBasisFiatAmountCents =
                        currentCostBasisFiatAmountCents.minus(fiatAmountCents);
                }

                // if the current balance dips to 0.001 or less, wipe the basis to $0 so we can start fresh, we cannot just use 0 bc of dust
                if (currentBalance.isLessThanOrEqualTo(0.001)) {
                    currentCostBasisFiatAmountCents = new BigNumber(0);
                }
            }
        }

        if (currentCostBasisFiatAmountCents.isNegative()) {
            return success({
                hasDeposits,
                averagePurchasePriceCents: null,
                currentBalance,
                currentCostBasisCents: null,
                isStableCoin: isStable,
            });
        }

        // Calculate the average purchase price
        const averagePurchasePrice = currentBalance.gt(0)
            ? currentCostBasisFiatAmountCents.dividedBy(currentBalance)
            : null;

        return success({
            hasDeposits,
            averagePurchasePriceCents: averagePurchasePrice,
            currentBalance,
            currentCostBasisCents: currentCostBasisFiatAmountCents,
            isStableCoin: isStable,
        });
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _isTransferForToken =
    (token: { contractAddress: string; provider: AccountProvider }) =>
    (transfer: Transfer) =>
        transfer.tokenContractAddress === token.contractAddress &&
        transfer.provider === token.provider;

const _balanceTransfers = async (
    transaction: Transaction
): Promise<Transfer[]> => {
    const isTrade = transaction.type === TransactionType.Trade;
    const transfers = _getRelevantTransfers(transaction);

    if (isTrade) {
        const isStableSwap = _isStableSwap(transaction, transfers);

        if (isStableSwap) {
            return _balanceAgainstMostStableSide(transaction, transfers);
        }

        // ex. for solana we want to balance against that if they deposited it
        const hasHighlyLiquidToken = _isSwapWithHighlyLiquidToken(
            transaction,
            transfers
        );

        if (hasHighlyLiquidToken) {
            return _balanceAgainstMostLiquidSide(transaction, transfers);
        }

        return _balanceAgainstReceiveSide(transaction, transfers);
    }

    return transfers;
};

const _getRelevantTransfers = (transaction: Transaction) => {
    const transfers = transaction.transfers;

    // any transfers that have the same token, amount, and one is receive and other is sent. filter them out
    const transferByAmt = groupBy(
        transfers,
        (t) => `${t.tokenContractAddress}:${t.amount.toString()}`
    );

    const relevantTransfers = Object.values(transferByAmt)
        .filter((t) => {
            // if only one transfer of this contract address and amount, we're good include this
            if (t.length === 1) return true;

            // if it is 2, and one is sent and one is received
            // we don't want to include it bc it was cancelled out
            const types = new Set(t.map((t) => t.type));

            if (
                t.length === 2 &&
                types.has(TransferType.Sent) &&
                types.has(TransferType.Received)
            ) {
                return false;
            }

            return true;
        })
        .flat();

    return relevantTransfers;
};

const _getIdentifier = (t: Transfer) =>
    `${t.provider}:${t.tokenContractAddress}`;

const _isStableSwap = (
    _transaction: Transaction,
    relevantTransfers: Transfer[]
) => {
    // if one of the sides of the swap is stable
    const received = relevantTransfers.filter(
        (t) => t.type === TransferType.Received
    );

    const sent = relevantTransfers.filter((t) => t.type === TransferType.Sent);

    return (
        received.some((t) => STABLE_COIN_IDENTIFIERS.has(_getIdentifier(t))) ||
        sent.some((t) => STABLE_COIN_IDENTIFIERS.has(_getIdentifier(t)))
    );
};

// only Solana for now
const _isSwapWithHighlyLiquidToken = (
    _transaction: Transaction,
    relevantTransfers: Transfer[]
) => {
    // if one of the sides of the swap is stable
    const received = relevantTransfers.filter(
        (t) => t.type === TransferType.Received
    );

    const sent = relevantTransfers.filter((t) => t.type === TransferType.Sent);

    return (
        received.some((t) => LIQUID_TOKEN_IDENTIFIERS.has(t.tokenIdentifier)) ||
        sent.some((t) => LIQUID_TOKEN_IDENTIFIERS.has(t.tokenIdentifier))
    );
};

const _balanceAgainstMostStableSide = async (
    _transaction: Transaction,
    relevantTransfers: Transfer[]
): Promise<Transfer[]> => {
    // Identify the stable and non-stable side
    const sentTransfers = relevantTransfers.filter(
        (t) => t.type === TransferType.Sent
    );

    const receivedTransfers = relevantTransfers.filter(
        (t) => t.type === TransferType.Received
    );

    const sentSideIsStable = sentTransfers.some((t) =>
        STABLE_COIN_IDENTIFIERS.has(_getIdentifier(t))
    );

    if (sentSideIsStable) {
        const fiatAmountCentsSent = sumBigNumbers(
            sentTransfers.map(_getFiatAmountForTransfer)
        );

        const receivedAmount = sumBigNumbers(
            receivedTransfers.map((t) => t.amount)
        );

        // this is prob a lil confusing but basically we get the portion of USDC paid for each unit of other,
        // that way we can split it proportionally. there is literally only one send and one receive right now tho,
        // so this really isn't necessary but is just a lil more bullet proof I guess. like what if jupiter returns back a bit of token and then another bit of token, maybe cannot happen?
        // whatever -> moving on lol may come back to this later
        const fiatValuePerToken = fiatAmountCentsSent.dividedBy(receivedAmount);

        return [
            ...sentTransfers,
            ...receivedTransfers.map((t) => {
                return {
                    ...t,
                    fiatAmountCents: t.amount.multipliedBy(fiatValuePerToken),
                };
            }),
        ];
    }

    const fiatAmountCentsReceived = sumBigNumbers(
        receivedTransfers.map(_getFiatAmountForTransfer)
    );

    const sentAmount = sumBigNumbers(sentTransfers.map((t) => t.amount));

    const fiatValuePerToken = fiatAmountCentsReceived.dividedBy(sentAmount);

    return [
        ...receivedTransfers,
        ...sentTransfers.map((t) => {
            return {
                ...t,
                fiatAmountCents: t.amount.multipliedBy(fiatValuePerToken),
            };
        }),
    ];
};

const _balanceAgainstReceiveSide = async (
    _transaction: Transaction,
    relevantTransfers: Transfer[]
): Promise<Transfer[]> => {
    const sentTransfers = relevantTransfers.filter(
        (t) => t.type === TransferType.Sent
    );

    const receivedTransfers = relevantTransfers.filter(
        (t) => t.type === TransferType.Received
    );

    const fiatAmountCentsReceived = sumBigNumbers(
        receivedTransfers.map(_getFiatAmountForTransfer)
    );

    const sentAmount = sumBigNumbers(sentTransfers.map((t) => t.amount));

    const fiatValuePerToken = fiatAmountCentsReceived.dividedBy(sentAmount);

    return [
        ...receivedTransfers,
        ...sentTransfers.map((t) => {
            return {
                ...t,
                fiatAmountCents: t.amount.multipliedBy(fiatValuePerToken),
            };
        }),
    ];
};

// same as most stable but for highly liquid (ex. just SOL)
const _balanceAgainstMostLiquidSide = async (
    _transaction: Transaction,
    relevantTransfers: Transfer[]
): Promise<Transfer[]> => {
    // Identify the stable and non-stable side
    const sentTransfers = relevantTransfers.filter(
        (t) => t.type === TransferType.Sent
    );

    const receivedTransfers = relevantTransfers.filter(
        (t) => t.type === TransferType.Received
    );

    const sentSideIsHighlyLiquid = sentTransfers.some((t) =>
        LIQUID_TOKEN_IDENTIFIERS.has(t.tokenIdentifier)
    );

    if (sentSideIsHighlyLiquid) {
        const fiatAmountCentsSent = sumBigNumbers(
            sentTransfers.map(_getFiatAmountForTransfer)
        );

        const receivedAmount = sumBigNumbers(
            receivedTransfers.map((t) => t.amount)
        );

        // this is prob a lil confusing but basically we get the portion of USDC paid for each unit of other,
        // that way we can split it proportionally. there is literally only one send and one receive right now tho,
        // so this really isn't necessary but is just a lil more bullet proof I guess. like what if jupiter returns back a bit of token and then another bit of token, maybe cannot happen?
        // whatever -> moving on lol may come back to this later
        const fiatValuePerToken = fiatAmountCentsSent.dividedBy(receivedAmount);

        return [
            ...sentTransfers,
            ...receivedTransfers.map((t) => {
                return {
                    ...t,
                    fiatAmountCents: t.amount.multipliedBy(fiatValuePerToken),
                };
            }),
        ];
    }

    const fiatAmountCentsReceived = sumBigNumbers(
        receivedTransfers.map(_getFiatAmountForTransfer)
    );

    const sentAmount = sumBigNumbers(sentTransfers.map((t) => t.amount));

    const fiatValuePerToken = fiatAmountCentsReceived.dividedBy(sentAmount);

    return [
        ...receivedTransfers,
        ...sentTransfers.map((t) => {
            return {
                ...t,
                fiatAmountCents: t.amount.multipliedBy(fiatValuePerToken),
            };
        }),
    ];
};

const _getFiatAmountForTransfer = (t: Transfer) => {
    if (STABLE_COIN_IDENTIFIERS.has(_getIdentifier(t))) {
        return t.amount.multipliedBy(100);
    }

    if (t.hasLookedUpFiatAmount) {
        return t.fiatAmountCents ?? ZERO_BN;
    }

    return ZERO_BN;
};

if (require.main === module) {
    connect()
        .then(async () => {
            const userResponse = await pgUserRepo.findByEmail(
                "andrew.j.duca@gmail.com"
            );

            const provider = AccountProvider.Solana;
            const contractAddress =
                "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv";

            const basis = await getCostBasis(userResponse.value.id, {
                contractAddress,
                provider,
            });
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
