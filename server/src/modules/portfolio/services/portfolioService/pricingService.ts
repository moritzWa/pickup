import {
    CurrentPriceDollarsResponseDataV2,
    Datadog,
    coingecko,
} from "src/utils";
import { fork, parallel } from "radash";
import { redisHistoricalPricing, redisPersisted } from "src/utils/cache";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { Dictionary, groupBy, isNil, keyBy } from "lodash";
import BigNumber from "bignumber.js";
import { CurrencyCode } from "src/shared/domain";
import { getCoingeckoForToken } from "src/shared/coingecko/getCoingeckoForToken";
import { FullPosition, Position } from "src/shared/integrations/types";
import * as numbro from "numbro";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { RealtimeAssetPriceV2 } from "src/modules/tokens/services/providers/types";
import {
    CoingeckoDEXData,
    CoingeckoDEXPriceInfo,
    CoingeckoPoolDEX,
} from "src/utils/coingecko/types";
import { STABLE_COIN_COIN_GECKOS } from "src/shared/domain/stablecoins";
import { BLACKLISTED_TOKEN_PRICES } from "./blacklistedTokenPrices";

const getPositionsWithPrices = async (
    _positions: Position[]
): Promise<FailureOrSuccess<DefaultErrors, FullPosition[]>> => {
    const positionsWithCoingeckoIds = await parallel(
        5,
        _positions,
        async (p): Promise<Position> => {
            const coingeckoIdResponse = await getCoingeckoForToken(
                p.provider,
                p.contractAddress
            );

            if (coingeckoIdResponse.isFailure()) {
                return p;
            }

            const coingeckoId = coingeckoIdResponse.value;

            return {
                ...p,
                coingeckoTokenId: coingeckoId,
            };
        }
    );

    const [coingeckoPositions, nonCoingeckoPositions] = fork(
        positionsWithCoingeckoIds,
        (p) => !!p.coingeckoTokenId
    );

    const [pricesForCGResponse, dexPricesResponse] = await Promise.all([
        getPriceForCoingecko(
            coingeckoPositions.map((p) => p.coingeckoTokenId).filter(hasValue)
        ),
        getPriceForCoingeckoDEX(
            nonCoingeckoPositions.map((p) => p).filter(hasValue)
        ),
    ]);

    if (pricesForCGResponse.isFailure()) {
        return failure(pricesForCGResponse.error);
    }

    // Note: don't check dexPricesResponse bc it can error if we cannot find the tokens
    // need to figure out how to make this error handling better at some point FIXME:

    const dexPrices = dexPricesResponse.isSuccess()
        ? dexPricesResponse.value
        : [];
    const pricesForCoingeckoIds = pricesForCGResponse.value;

    const coingeckoToPrice = keyBy(
        pricesForCoingeckoIds,
        (p) => p.coinGeckoId || ""
    );
    const dexToPrice = keyBy(
        dexPrices,
        (p) => `${p.provider}:${p.contractAddress}` || ""
    );

    const positionsWithPrices = positionsWithCoingeckoIds.map(
        (p): FullPosition => {
            const coingeckoId = p.coingeckoTokenId;
            const key = `${p.provider}:${p.contractAddress}`;
            const isBlacklisted = BLACKLISTED_TOKEN_PRICES.has(key);

            const dexKey = !coingeckoId
                ? `${p.provider}:${p.contractAddress}`
                : null;

            const coinInfo: Maybe<RealtimeAssetPriceV2> = isBlacklisted
                ? null
                : (coingeckoId
                      ? coingeckoToPrice[coingeckoId]
                      : dexToPrice[dexKey || ""]) || null;

            const isStable =
                coingeckoId && STABLE_COIN_COIN_GECKOS.has(coingeckoId);

            const priceUsdCents = isStable
                ? new BigNumber(100)
                : coinInfo &&
                  !isNil(coinInfo?.priceCents) &&
                  !coinInfo?.priceCents?.isNaN()
                ? new BigNumber(coinInfo?.priceCents ?? 0)
                : null;

            const totalFiatAmountCents = priceUsdCents
                ? priceUsdCents.multipliedBy(p.amount)
                : null;

            const dailyChangePercent =
                !isNil(coinInfo) &&
                !isNil(coinInfo?.dailyChangePercent) &&
                !isStable
                    ? new BigNumber(coinInfo.dailyChangePercent)
                    : null;

            const dailyChangePerUnitCents = getDailyChangeUSD({
                usd24hChangePercent: dailyChangePercent?.toNumber() || null,
                priceCents: new BigNumber(coinInfo?.priceCents ?? 0).toNumber(),
            });

            const dailyFiatAmountCents =
                dailyChangePerUnitCents && !isStable
                    ? dailyChangePerUnitCents.multipliedBy(p.amount)
                    : null;

            const dailyPercentageFormatted = formatPercent(dailyChangePercent);

            return {
                isNativeToken: p.isNativeToken,
                amount: p.amount,
                iconImageUrl: p.iconImageUrl,
                symbol: p.symbol,
                provider: p.provider,
                contractAddress: p.contractAddress,
                coingeckoTokenId: p.coingeckoTokenId,
                priceCents: priceUsdCents,
                totalFiatAmountCents,
                fiatCurrency: CurrencyCode.USD,
                dailyChangePercentage: dailyChangePercent,
                dailyChangePerUnitCents,
                dailyFiatAmountCents,
                dailyPercentageFormatted,
                canSelectToken: p.canSelectToken,
            };
        }
    );

    return success(positionsWithPrices);
};

export const getPriceForCoingeckoDEX = async (
    tokens: { provider: AccountProvider; contractAddress: string }[]
): Promise<FailureOrSuccess<DefaultErrors, RealtimeAssetPriceV2[]>> => {
    if (!tokens.length) {
        return success([]);
    }

    const provider = tokens[0].provider;
    const prices: CoingeckoDEXPriceInfo[] = [];
    const tokenInfo: CoingeckoDEXData[] = [];
    const poolAddresses: string[] = [];
    const tokenToPoolAddress: Record<string, string> = {};

    const tokenByProvider = groupBy(tokens, (t) => t.provider);

    for (const [_provider, tokens] of Object.entries(tokenByProvider)) {
        const provider = _provider as AccountProvider;

        const [currentPriceResponse, tokenInfoResponse] = await Promise.all([
            coingecko.getCurrentPriceDollarsFromDEX(
                provider,
                tokens.map((t) => t.contractAddress)
            ),
            coingecko.dex.getTokens(
                provider,
                tokens.map((t) => t.contractAddress)
            ),
        ]);

        if (currentPriceResponse.isSuccess()) {
            // Update cache with new data

            prices.push(...currentPriceResponse.value);
        }

        if (tokenInfoResponse.isSuccess()) {
            tokenInfo.push(...tokenInfoResponse.value);

            const pools = tokenInfo
                .flatMap((t) => {
                    const pools =
                        t.relationships.top_pools?.data?.map((p) => p.id) ?? [];
                    const bestPool = pools[0];

                    tokenToPoolAddress[t.attributes.address] = bestPool;

                    return bestPool;
                })
                .filter(hasValue);

            const actualAddresses = pools
                .map((p) => (p || "").split("_")[1])
                .filter(hasValue);

            poolAddresses.push(...actualAddresses);
        }
    }

    const poolResponse = await coingecko.dex.getPools(provider, poolAddresses);

    // Combine cache and API response data
    const combinedPrices = [...prices];

    const poolByContract = poolResponse.isSuccess()
        ? keyBy(poolResponse.value, (p: CoingeckoPoolDEX) => p.id)
        : {};

    const formattedPrices = combinedPrices.map((v): RealtimeAssetPriceV2 => {
        const poolAddress = tokenToPoolAddress[v.contract];
        const poolInfo = poolByContract[poolAddress];
        const dailyChangePercent =
            poolInfo?.attributes?.price_change_percentage?.h24 || null;
        const marketCap = poolInfo?.attributes?.market_cap_usd || null;

        const dailyChangePerUnitCents = getDailyChangeUSD({
            usd24hChangePercent: !isNil(dailyChangePercent)
                ? new BigNumber(dailyChangePercent).div(100).toNumber()
                : null,
            priceCents: new BigNumber(v.priceUsdDollars ?? 0)
                .multipliedBy(100)
                .toNumber(),
        });

        return {
            priceCents: new BigNumber(v.priceUsdDollars).multipliedBy(100),
            isFiat: true,
            contractAddress: v.contract,
            provider: v.provider,
            coinGeckoId: null,
            // this is the percent, ex. -3.04 is 3.04% down, so we want to convert it to -0.0304
            dailyChangePercent: !isNil(dailyChangePercent)
                ? new BigNumber(dailyChangePercent).div(100)
                : null,
            dailyChangePerUnitCents: dailyChangePerUnitCents,
            marketCapUsdCents: !isNil(marketCap)
                ? new BigNumber(marketCap).multipliedBy(100)
                : null,
            currency: "USD",
        };
    });

    return success(formattedPrices);
};

export const getPriceForCoingecko = async (
    tokenIds: string[]
): Promise<FailureOrSuccess<DefaultErrors, RealtimeAssetPriceV2[]>> => {
    const pricesFromCache: CurrentPriceDollarsResponseDataV2[] = [];
    const pricesFromApi: CurrentPriceDollarsResponseDataV2[] = [];

    // console.log(
    //     `[cache hits: ${pricesFromCache.length}. cache misses: ${tokenIdsMissingFromCache.length}]`
    // );

    if (tokenIds.length > 0) {
        const currentPriceResponse =
            await coingecko.getCurrentPriceDollarsForIds(tokenIds);

        if (currentPriceResponse.isFailure()) {
            return failure(currentPriceResponse.error);
        }

        pricesFromApi.push(...currentPriceResponse.value);
    }

    // Combine cache and API response data
    const combinedPrices = [...pricesFromCache, ...pricesFromApi];

    const prices = combinedPrices.map(
        (v): RealtimeAssetPriceV2 => ({
            priceCents: new BigNumber(v.usd).multipliedBy(100),
            isFiat: true,
            contractAddress: null,
            provider: null,
            // this is the percent, ex. -3.04 is 3.04% down, so we want to convert it to -0.0304
            dailyChangePercent: !isNil(v.usd24hChange)
                ? new BigNumber(v.usd24hChange).div(100)
                : null,
            dailyChangePerUnitCents: getDailyChangeUSD({
                usd24hChangePercent: !isNil(v.usd24hChange)
                    ? new BigNumber(v.usd24hChange).div(100).toNumber()
                    : null,
                priceCents: new BigNumber(v.usd).multipliedBy(100).toNumber(),
            }),
            marketCapUsdCents: !isNil(v.usdMarketCap)
                ? new BigNumber(v.usdMarketCap).multipliedBy(100)
                : null,
            currency: "USD",
            coinGeckoId: v.coinGeckoId,
        })
    );

    return success(prices);
};

export const getDailyChangeUSD = (c: {
    usd24hChangePercent: string | number | null;
    priceCents: string | number | null;
}): Maybe<BigNumber> => {
    if (isNil(c.usd24hChangePercent)) {
        return null;
    }
    if (isNil(c.priceCents)) {
        return null;
    }

    const dailyPercentChange = new BigNumber(c.usd24hChangePercent);
    const currentPriceCents = new BigNumber(c.priceCents);

    const startingDayPriceCents = currentPriceCents.div(
        dailyPercentChange.plus(1)
    );
    const diff = currentPriceCents.minus(startingDayPriceCents);

    // ex. there are some rugs that are -100% and screw this up a lot
    if (!diff.isFinite()) {
        return null;
    }

    return diff;
};

export const formatPercent = (n: Maybe<number | BigNumber>) => {
    return !isNil(n)
        ? // @ts-ignore
          numbro(new BigNumber(n || 0).multipliedBy(100).toNumber()).format(
              "0,0.[00]"
          ) + "%"
        : null;
};

export const getCoingeckoDEXPriceCacheKey = (
    provider: string,
    contract: string
) => {
    return `portfolio_prices:v1:dex:${provider}:${contract}`;
};

export const PricingService = {
    getPositionsWithPrices,
};
