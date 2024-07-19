import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { PositionService } from "./positionsService";
import { PricingService } from "./pricingService";
import { connect } from "src/core/infra/postgres";
import {
    FullPosition,
    IntegrationTransaction,
} from "src/shared/integrations/types";
import { TransactionsService } from "./transactionsService";
import { magic } from "src/utils/magic";
import { PusherEventName, pusher } from "src/utils/pusher";
import { User } from "src/core/infra/postgres/entities";
import { redisPersisted, setRedis } from "src/utils/cache";
import { Helpers, ZERO_BN, sumBigNumbers } from "src/utils";
import BigNumber from "bignumber.js";
import { isNil, orderBy } from "lodash";
import { acquireLock, redlock, releaseLock } from "src/utils/redlock";
import { pgUserRepo } from "src/modules/users/infra/postgres";

const getCacheKey = (id: string) => `portfolio:user_${id}`;

const getFullPositionsFromMagicAndSetCache = async (
    user: User
): Promise<FailureOrSuccess<DefaultErrors, FullPosition[]>> => {
    // // try to claim a lock so we don't do it a bunch in parallel and chew through API credits
    // const lockKey = `portfolio:lock_${user.id}`;
    // const lockResponse = await acquireLock(redlock, [lockKey], 5_000);

    // if (lockResponse.isFailure()) {
    //     return failure(lockResponse.error);
    // }

    const allPositionsResponses =
        await PositionService.getPositionsForMagicUser(user.magicIssuer);

    if (allPositionsResponses.isFailure()) {
        return failure(allPositionsResponses.error);
    }

    const allPositions = allPositionsResponses.value;

    const positions = allPositions.flatMap((p) => p.positions);

    const positionsWithPricesResponse =
        await PricingService.getPositionsWithPrices(positions);

    if (positionsWithPricesResponse.isFailure()) {
        return failure(positionsWithPricesResponse.error);
    }

    const _positionsWithPrices = positionsWithPricesResponse.value;

    const sorted = orderBy(
        _positionsWithPrices,
        (p) => new BigNumber(p.totalFiatAmountCents ?? 0).toNumber(),
        "desc"
    );

    const totalEstimatedPortfolioValueCents = sumBigNumbers(
        sorted.map((p) =>
            !isNil(p.totalFiatAmountCents) && !p.totalFiatAmountCents.isNaN()
                ? p.totalFiatAmountCents
                : ZERO_BN
        )
    );

    // update the cached info on the user
    await pgUserRepo.update(user.id, {
        estimatedPortfolioValueCents: totalEstimatedPortfolioValueCents
            .dp(0)
            .toNumber(),
        wallets: allPositions.map((p) => ({
            provider: p.provider,
            publicKey: p.publicKey,
        })),
    });

    // add to cache, note: we do not wait to see if failure or success. failures shouldn't stop us from returning
    // the results to the user
    await setRedis(
        redisPersisted,
        getCacheKey(user.id),
        JSON.stringify(sorted)
    );

    // emit event so client can refetch the portfolio
    await pusher.trigger(`user-${user.id}`, PusherEventName.PortfolioRefreshed);

    // await releaseLock(lockResponse.value);

    return success(sorted);
};

const getFullPositions = async (
    user: User,
    canUseCache: boolean
): Promise<FailureOrSuccess<DefaultErrors, FullPosition[]>> => {
    const key = getCacheKey(user.id);

    const value = await redisPersisted.get(key);

    if (value && canUseCache) {
        const rawParsed = Helpers.maybeParseJSON<FullPosition[]>(value);

        if (rawParsed.isSuccess() && rawParsed.value) {
            const parsed = rawParsed.value.map(
                (p): FullPosition => ({
                    isNativeToken: p.isNativeToken,
                    provider: p.provider,
                    iconImageUrl: p.iconImageUrl,
                    symbol: p.symbol,
                    contractAddress: p.contractAddress,
                    totalFiatAmountCents: !isNil(p.totalFiatAmountCents)
                        ? new BigNumber(p.totalFiatAmountCents)
                        : null,
                    coingeckoTokenId: p.coingeckoTokenId,
                    priceCents: !isNil(p?.priceCents)
                        ? new BigNumber(p.priceCents)
                        : null,
                    dailyChangePercentage: !isNil(p?.dailyChangePercentage)
                        ? new BigNumber(p.dailyChangePercentage)
                        : null,
                    dailyChangePerUnitCents: !isNil(p?.dailyChangePerUnitCents)
                        ? new BigNumber(p.dailyChangePerUnitCents)
                        : null,
                    fiatCurrency: p.fiatCurrency,
                    dailyPercentageFormatted: p.dailyPercentageFormatted,
                    amount: new BigNumber(p.amount),
                    dailyFiatAmountCents: !isNil(p?.dailyFiatAmountCents)
                        ? new BigNumber(p.dailyFiatAmountCents)
                        : null,
                    canSelectToken: Boolean(p.canSelectToken),
                })
            );

            // order by fiat amount descending
            const sorted = orderBy(
                parsed,
                (p) => p.totalFiatAmountCents?.toNumber(),
                "desc"
            );

            return success(sorted);
        }
    }

    const response = await getFullPositionsFromMagicAndSetCache(user);

    // if success return that
    if (response.isSuccess()) {
        return response;
    }

    // otherwise if the above errored, try to use the cache if there is one. before fully erroring
    if (value) {
        const rawParsed = Helpers.maybeParseJSON<FullPosition[]>(value);

        if (rawParsed.isSuccess() && rawParsed.value) {
            const parsed = rawParsed.value.map(
                (p): FullPosition => ({
                    isNativeToken: p.isNativeToken,
                    provider: p.provider,
                    iconImageUrl: p.iconImageUrl,
                    symbol: p.symbol,
                    contractAddress: p.contractAddress,
                    totalFiatAmountCents: !isNil(p.totalFiatAmountCents)
                        ? new BigNumber(p.totalFiatAmountCents)
                        : null,
                    coingeckoTokenId: p.coingeckoTokenId,
                    priceCents: !isNil(p?.priceCents)
                        ? new BigNumber(p.priceCents)
                        : null,
                    dailyChangePercentage: !isNil(p?.dailyChangePercentage)
                        ? new BigNumber(p.dailyChangePercentage)
                        : null,
                    dailyChangePerUnitCents: !isNil(p?.dailyChangePerUnitCents)
                        ? new BigNumber(p.dailyChangePerUnitCents)
                        : null,
                    fiatCurrency: p.fiatCurrency,
                    dailyPercentageFormatted: p.dailyPercentageFormatted,
                    amount: new BigNumber(p.amount),
                    dailyFiatAmountCents: !isNil(p?.dailyFiatAmountCents)
                        ? new BigNumber(p.dailyFiatAmountCents)
                        : null,
                    canSelectToken: Boolean(p.canSelectToken),
                })
            );

            // order by fiat amount descending
            const sorted = orderBy(
                parsed,
                (p) => p.totalFiatAmountCents?.toNumber(),
                "desc"
            );

            return success(sorted);
        }
    }

    return failure(new UnexpectedError("Failed to get positions."));
};

const getFullTransactions = async (
    issuer: string
): Promise<FailureOrSuccess<DefaultErrors, IntegrationTransaction[]>> => {
    const allTxnsResponses =
        await TransactionsService.getTransactionsForMagicUser(issuer);

    if (allTxnsResponses.isFailure()) {
        return failure(allTxnsResponses.error);
    }

    const allTxns = allTxnsResponses.value;

    return success(allTxns);
};

export const MagicPortfolioService = {
    getFullPositions,
    getFullTransactions,
    getFullPositionsFromMagicAndSetCache,
};

if (require.main === module) {
    connect()
        .then(async () => {
            const userResponse = await pgUserRepo.findByEmail(
                "jaibajaj06@gmail.com"
            );

            const user = await getFullPositions(userResponse.value, false);

            console.log(user);
            debugger;
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
