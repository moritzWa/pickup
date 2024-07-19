import { AccountProvider, Transaction } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import {
    SOLANA_IDENTIFIER,
    WRAPPED_SOL_MINT,
} from "src/shared/integrations/providers/solana/constants";
import { cryptoPriceService } from "src/shared/pricing/cryptoPriceCache";
import { PricingCache } from "src/shared/pricing/pricingCache";
import { coingecko } from "src/utils";
import { CoinGeckoTokenId } from "src/utils/coingecko/types";
import { transactionRepo, transferRepo } from "../infra";
import BigNumber from "bignumber.js";
import { STABLE_COIN_IDENTIFIERS } from "src/shared/domain/stablecoins";

export const syncTransactionFiatAmount = async (
    transaction: Transaction,
    solanaPricing: PricingCache
): Promise<FailureOrSuccess<DefaultErrors, Transaction>> => {
    try {
        const transfersWithoutFiatAmounts = transaction.transfers.filter(
            (t) => !t.hasLookedUpFiatAmount
        );

        if (!transfersWithoutFiatAmounts.length) {
            return success(transaction);
        }

        const responses = await Promise.all(
            transfersWithoutFiatAmounts.map(async (t) => {
                const identifier = `${t.provider}:${t.tokenContractAddress}`;

                const isSolanaTransfer = identifier === SOLANA_IDENTIFIER;

                if (isSolanaTransfer) {
                    const price = await solanaPricing.getPrice(t.createdAt);

                    // if the token is a stable coin, update it
                    if (STABLE_COIN_IDENTIFIERS.has(identifier)) {
                        return await transferRepo.update(t.id, {
                            hasLookedUpFiatAmount: true,
                            fiatAmountCents: new BigNumber(
                                t.amount
                            ).multipliedBy(100),
                        });
                    }

                    if (price.isSuccess()) {
                        const fiatAmountCents = new BigNumber(t.amount)
                            .multipliedBy(
                                new BigNumber(
                                    price.value.price ?? 0
                                ).multipliedBy(100)
                            )
                            .dp(0);

                        return await transferRepo.update(t.id, {
                            hasLookedUpFiatAmount: true,
                            fiatAmountCents,
                        });
                    }

                    return failure(price.error);
                }

                // otherwise we cannot get the price for it so just set to null and mark has looked up so we don't do it again
                // this happens for memecoins. we don't need the price bc we use the SOL / USDC to balance the price
                return await transferRepo.update(t.id, {
                    hasLookedUpFiatAmount: true,
                    fiatAmountCents: null,
                });
            })
        );

        const hasFailures = responses.some((r) => r.isFailure());

        if (hasFailures) {
            return failure(new UnexpectedError("Failed to sync fiat amounts"));
        }

        const newTxnResponse = await transactionRepo.findById(transaction.id, {
            relations: { transfers: true },
        });

        return newTxnResponse;
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const syncAllTransactions = async (
    transactions: Transaction[]
): Promise<FailureOrSuccess<DefaultErrors, Transaction[]>> => {
    try {
        const solanaPricingService = await cryptoPriceService.getPricingService(
            CoinGeckoTokenId.Solana
        );

        if (solanaPricingService.isFailure()) {
            return failure(solanaPricingService.error);
        }

        const pricing = solanaPricingService.value;

        const updatedTransactionsResponses = await Promise.all(
            transactions.map((t) => syncTransactionFiatAmount(t, pricing))
        );

        const hasFailures = updatedTransactionsResponses.some((r) =>
            r.isFailure()
        );

        if (hasFailures) {
            return failure(new UnexpectedError("Failed to sync fiat amounts"));
        }

        return success(
            updatedTransactionsResponses.map((r) => r.value as Transaction)
        );
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const SyncTransactionFiatAmountsService = {
    syncTransactionFiatAmount,
    syncAllTransactions,
};
