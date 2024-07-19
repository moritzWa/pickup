import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    NotFoundError,
    UnexpectedError,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { keyBy, maxBy, uniq } from "lodash";
import {
    CurrentPriceDollarsResponseData,
    Helpers,
    Slack,
    SlackChannel,
    coingecko,
} from "src/utils";
import {
    CandlestickChartPoint,
    CandlestickChartResponse,
    ChartPoint,
    DateInfoForPricingProvider,
    IAssetPricingProvider,
    LineChartPoint,
    LineChartResponse,
    RealtimeAssetPrice,
    TokenInfo,
} from "./types";
import BigNumber from "bignumber.js";
import { redisPersisted } from "src/utils/cache";
import * as moment from "moment-timezone";
import { ChartType, Granularity } from "src/shared/domain";
import { roundToNearestIncrementV2 } from "./utils";

const FUNGIBLE_TOKEN_PARALLELISM = 5;
const CACHE_PREFIX = "aps:gecko:v1";
const CACHE_TTL_SECONDS = 15;
const START_BUFFER_SECONDS = 5 * 60; // 5 minutes start buffer

export class CoingeckoPricingService implements IAssetPricingProvider {
    name: string = "coingecko:fungible";

    constructor() {}

    static async init(): Promise<IAssetPricingProvider> {
        return new CoingeckoPricingService();
    }

    getLineChart = async (
        dateInfo: DateInfoForPricingProvider,
        token: TokenInfo
    ): LineChartResponse => {
        if (token.sourceType === "coingecko_id") {
            return _getLineChartForCoingeckoId(dateInfo, token);
        }

        if (token.sourceType === "coingecko_contract_address") {
            return _getLineChartForCoingeckoContract(dateInfo, token);
        }

        return failure(
            new UnexpectedError("Invalid source type for token info.")
        );
    };

    getCandlestickChart = async (
        dateInfo: DateInfoForPricingProvider,
        token: TokenInfo
    ): CandlestickChartResponse => {
        if (token.sourceType === "coingecko_id") {
            return _getCandlestickChartForCoingeckoId(dateInfo, token);
        }

        if (token.sourceType === "coingecko_contract_address") {
            return _getCandlestickChartForCoingeckoContract(dateInfo, token);
        }

        return failure(
            new UnexpectedError("Invalid source type for token info.")
        );
    };

    getRealtimePriceInCentsForAsset = async (
        fungibleToken: any
    ): Promise<FailureOrSuccess<DefaultErrors, Maybe<RealtimeAssetPrice>>> => {
        const coingeckoId = fungibleToken.coinGeckoTokenId;

        if (!coingeckoId) {
            return failure(
                new Error("The asset doesn't have coingecko token ID.")
            );
        }

        const cacheKey = `${CACHE_PREFIX}:${coingeckoId}`;
        const value = await redisPersisted.get(cacheKey);

        if (value) {
            const parsed = Helpers.maybeParseJSON(value);
            const d = parsed.value as CurrentPriceDollarsResponseData;
            if (parsed && parsed.isSuccess() && d.usd) {
                // console.log("[cache hit real-time price]");
                return success({
                    value: new BigNumber(d.usd).multipliedBy(100),
                    isFiat: true,
                    currency: "USD",
                });
            }
        }

        const currentPriceResponse = await coingecko.getCurrentPriceDollars(
            coingeckoId
        );

        if (currentPriceResponse.isFailure()) {
            // if token not found in coingecko, we are going to just assume the price is null
            if (currentPriceResponse.error instanceof NotFoundError) {
                return success(null);
            }

            return failure(currentPriceResponse.error);
        }

        const values = currentPriceResponse.value;

        await redisPersisted.set(
            cacheKey,
            JSON.stringify(values),
            "EX",
            CACHE_TTL_SECONDS
        );

        return success({
            value: new BigNumber(values.usd).multipliedBy(100), // Note: don't round bc this will affect coins with sub penny values
            isFiat: true,
            currency: "USD",
        });
    };
}

const _getLineChartForCoingeckoId = async (
    dateInfo: DateInfoForPricingProvider,
    token: TokenInfo
): LineChartResponse => {
    if (!token.coinGeckoTokenId) {
        return failure(new Error("No coingecko token"));
    }

    const createdAt = null;

    // take the timezone but subtract one unit so we get a little bit more of the past data
    // there were weird edge cases here which is why we are doing this
    // where we request for April 26 and after, but the soonest was April 27th so we had null for first points
    const startDate = moment(dateInfo.afterTz).subtract({
        [dateInfo.dateTimeUnit]: dateInfo.increment,
    });
    // ex. Jan 1st 7am = midnight of PST. each of these is in UTC but with the tz offset
    const endDate = moment(dateInfo.beforeTz);

    const startUtcSeconds = Math.floor(startDate.toDate().getTime() / 1000);
    const endUtcSeconds = Math.floor(endDate.toDate().getTime() / 1000);

    const pricingResponse = await coingecko.getHistoricalDataForRange(
        token.coinGeckoTokenId,
        {
            startUtcSeconds: startUtcSeconds, // - START_BUFFER_SECONDS,
            endUtcSeconds: endUtcSeconds,
        }
    );

    if (pricingResponse.isFailure()) {
        // if token not found -> return an empty price lookup
        if (pricingResponse.error instanceof NotFoundError) {
            return success({
                points: {},
                earliestDate: null,
            });
        }

        return failure(pricingResponse.error);
    }

    const price = pricingResponse.value;

    const data = price.data.map((d): ChartPoint => {
        const timestamp = roundToNearestIncrementV2(
            d.timestamp,
            dateInfo,
            createdAt
        );

        return {
            // round the timestamp to the nearest increment of the date info
            timestamp: timestamp.toISOString(),
            utcTimeSeconds: Math.floor(timestamp.getTime() / 1000),
            // Note: don't round bc shit-coins and coins with less than a penny
            priceCents: new BigNumber(d.price).multipliedBy(100).toNumber(),
            isPriceFilled: false,
            highPriceCents: null,
            lowPriceCents: null,
            openPriceCents: null,
            closePriceCents: null,
        };
    });

    const byDate = keyBy(data, (d) => d.timestamp);

    return success({
        points: byDate,
        earliestDate: null,
    });
};

const _getLineChartForCoingeckoContract = async (
    dateInfo: DateInfoForPricingProvider,
    token: TokenInfo
): LineChartResponse => {
    if (!token.contractAddress) {
        return failure(new Error("Contract address is missing."));
    }

    if (!token.provider) {
        return failure(new Error("Blockchain for token is missing."));
    }

    const poolResponse = await coingecko.getPoolsForToken(
        token.provider,
        token.contractAddress
    );

    if (poolResponse.isFailure()) {
        return failure(poolResponse.error);
    }

    const pools = poolResponse.value;
    const biggestPool = maxBy(pools, (p) => p.attributes.volume_usd);

    if (!biggestPool) {
        return failure(new Error("Couldn't get a pool for this token."));
    }

    // take the timezone but subtract one unit so we get a little bit more of the past data
    // there were weird edge cases here which is why we are doing this
    // where we request for April 26 and after, but the soonest was April 27th so we had null for first points
    const startDate = moment(dateInfo.afterTz).subtract({
        [dateInfo.dateTimeUnit]: dateInfo.increment,
    });
    // ex. Jan 1st 7am = midnight of PST. each of these is in UTC but with the tz offset
    const endDate = moment(dateInfo.beforeTz);

    const startUtcSeconds = Math.floor(startDate.toDate().getTime() / 1000);
    const endUtcSeconds = Math.floor(endDate.toDate().getTime() / 1000);

    const historicalDataResponse = await coingecko.getLineChartForPool(
        token.provider,
        biggestPool,
        dateInfo.granularity
    );

    if (historicalDataResponse.isFailure()) {
        // if token not found -> return an empty price lookup
        if (historicalDataResponse.error instanceof NotFoundError) {
            return success({
                points: {},
                earliestDate: null,
            });
        }

        return failure(historicalDataResponse.error);
    }

    const historicalData = historicalDataResponse.value;

    const data = historicalData.points
        .map((d): ChartPoint => {
            const timestamp = roundToNearestIncrementV2(
                d.timestamp,
                dateInfo,
                biggestPool.attributes.pool_created_at
                    ? new Date(biggestPool.attributes.pool_created_at)
                    : null
            );

            return {
                // round the timestamp to the nearest increment of the date info
                timestamp: timestamp.toISOString(),
                utcTimeSeconds: Math.floor(timestamp.getTime() / 1000),
                // Note: don't round bc shit-coins and coins with less than a penny
                priceCents: new BigNumber(d.closing)
                    .multipliedBy(100)
                    .toNumber(),
                isPriceFilled: false,
                openPriceCents: null,
                highPriceCents: null,
                lowPriceCents: null,
                closePriceCents: null,
            };
        })
        .filter((p) => {
            // filter if it is in between the utc start and end
            const timestampSeconds = new Date(p.timestamp).getTime() / 1000;
            const isInRange =
                timestampSeconds >= startUtcSeconds &&
                timestampSeconds <= endUtcSeconds;

            return isInRange;
        });

    // if (!data.length) {
    //     console.log("chart issue");
    //     console.log(data);
    //     console.log(historicalData.points);

    //     void Slack.send({
    //         channel: SlackChannel.TradingUrgent,
    //         format: true,
    //         message: [
    //             `No chart data points for ${token.contractAddress}`,
    //             `Points: ${historicalData.points.length} points`,
    //             `Our chart: ${data.length}`,
    //             `Start: ${startDate}`,
    //             `End: ${endDate}`,
    //             `Granularity: ${dateInfo.granularity}`,
    //         ].join("\n"),
    //     });
    // }

    const priceMapping = keyBy(data, (d) => d.timestamp);

    return success({
        points: priceMapping,
        earliestDate: null,
    });
};

const _getCandlestickChartForCoingeckoId = async (
    dateInfo: DateInfoForPricingProvider,
    token: TokenInfo
): CandlestickChartResponse => {
    if (!token.coinGeckoTokenId) {
        return failure(new Error("No coingecko token"));
    }

    const createdAt = token.createdAt;

    // take the timezone but subtract one unit so we get a little bit more of the past data
    // there were weird edge cases here which is why we are doing this
    // where we request for April 26 and after, but the soonest was April 27th so we had null for first points
    const startDate = moment(dateInfo.afterTz).subtract({
        [dateInfo.dateTimeUnit]: dateInfo.increment,
    });

    // ex. Jan 1st 7am = midnight of PST. each of these is in UTC but with the tz offset
    const endDate = moment(dateInfo.beforeTz);

    const startUtcSeconds = Math.floor(startDate.toDate().getTime() / 1000);
    const endUtcSeconds = Math.floor(endDate.toDate().getTime() / 1000);

    const pricingResponse = await coingecko.getHistoricalDataOHLC(
        token.coinGeckoTokenId,
        {
            startUtcSeconds: startUtcSeconds, // - START_BUFFER_SECONDS,
            endUtcSeconds: endUtcSeconds,
        }
    );

    if (pricingResponse.isFailure()) {
        // if token not found -> return an empty price lookup
        if (pricingResponse.error instanceof NotFoundError) {
            return success({
                points: {},
                earliestDate: null,
            });
        }

        return failure(pricingResponse.error);
    }

    const price = pricingResponse.value;

    const data = price.data.map((d): ChartPoint => {
        const timestamp = roundToNearestIncrementV2(
            d.timestamp,
            dateInfo,
            createdAt
        );

        return {
            // round the timestamp to the nearest increment of the date info
            timestamp: timestamp.toISOString(),
            utcTimeSeconds: Math.floor(timestamp.getTime() / 1000),
            // Note: don't round bc shit-coins and coins with less than a penny
            priceCents: new BigNumber(d.price).multipliedBy(100).toNumber(),
            openPriceCents: new BigNumber(d.open).multipliedBy(100).toNumber(),
            closePriceCents: new BigNumber(d.close)
                .multipliedBy(100)
                .toNumber(),
            highPriceCents: new BigNumber(d.high).multipliedBy(100).toNumber(),
            lowPriceCents: new BigNumber(d.low).multipliedBy(100).toNumber(),
            isPriceFilled: false,
        };
    });

    const priceMapping = keyBy(data, (d) => d.timestamp);

    return success({
        points: priceMapping,
        earliestDate: null, // TODO:
    });
};

const _getCandlestickChartForCoingeckoContract = async (
    dateInfo: DateInfoForPricingProvider,
    token: TokenInfo
): CandlestickChartResponse => {
    if (!token.contractAddress) {
        return failure(new Error("Contract address is missing."));
    }

    if (!token.provider) {
        return failure(new Error("Blockchain for token is missing."));
    }

    const poolResponse = await coingecko.getPoolsForToken(
        token.provider,
        token.contractAddress
    );

    if (poolResponse.isFailure()) {
        return failure(poolResponse.error);
    }

    const pools = poolResponse.value;
    const biggestPool = maxBy(pools, (p) => p.attributes.volume_usd);

    if (!biggestPool) {
        return failure(new Error("Couldn't get a pool for this token."));
    }

    // take the timezone but subtract one unit so we get a little bit more of the past data
    // there were weird edge cases here which is why we are doing this
    // where we request for April 26 and after, but the soonest was April 27th so we had null for first points
    const startDate = moment(dateInfo.afterTz).subtract({
        [dateInfo.dateTimeUnit]: dateInfo.increment,
    });

    // ex. Jan 1st 7am = midnight of PST. each of these is in UTC but with the tz offset
    const endDate = moment(dateInfo.beforeTz);

    const startUtcSeconds = Math.floor(startDate.toDate().getTime() / 1000);
    const endUtcSeconds = Math.floor(endDate.toDate().getTime() / 1000);

    const historicalDataResponse = await coingecko.getCandlestickChartForPool(
        token.provider,
        biggestPool,
        dateInfo.granularity
    );

    if (historicalDataResponse.isFailure()) {
        // if token not found -> return an empty price lookup
        if (historicalDataResponse.error instanceof NotFoundError) {
            return success({
                points: {},
                earliestDate: null,
            });
        }

        return failure(historicalDataResponse.error);
    }

    const historicalData = historicalDataResponse.value;

    const data = historicalData.points
        .filter((p) => {
            // filter if it is in between the utc start and end
            const timestampSeconds = new Date(p.timestamp).getTime() / 1000;
            return (
                timestampSeconds >= startUtcSeconds &&
                timestampSeconds <= endUtcSeconds
            );
        })
        .map((d): ChartPoint => {
            const timestamp = roundToNearestIncrementV2(
                d.timestamp,
                dateInfo,
                biggestPool.attributes.pool_created_at
                    ? new Date(biggestPool.attributes.pool_created_at)
                    : null
            );

            return {
                // round the timestamp to the nearest increment of the date info
                timestamp: timestamp.toISOString(),
                utcTimeSeconds: Math.floor(timestamp.getTime() / 1000),
                // Note: don't round bc shit-coins and coins with less than a penny
                priceCents: new BigNumber(d.close).multipliedBy(100).toNumber(),
                openPriceCents: new BigNumber(d.open)
                    .multipliedBy(100)
                    .toNumber(),
                highPriceCents: new BigNumber(d.high)
                    .multipliedBy(100)
                    .toNumber(),
                lowPriceCents: new BigNumber(d.low)
                    .multipliedBy(100)
                    .toNumber(),
                closePriceCents: new BigNumber(d.close)
                    .multipliedBy(100)
                    .toNumber(),
                isPriceFilled: false,
            };
        });

    const priceMapping = keyBy(data, (d) => d.timestamp);

    return success({
        points: priceMapping,
        earliestDate: null,
    });
};
