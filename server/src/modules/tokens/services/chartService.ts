import * as moment from "moment";
import { Token } from "src/shared/integrations/types";
import { Datadog, logHistogram, trackErr, trackOk } from "src/utils";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { first, isNil, minBy } from "lodash";
import BigNumber from "bignumber.js";
import { TradingIntegrationService } from "src/shared/integrations";
import {
    buildTimestampsBetweenRange,
    getDateInfoForGranularityV2,
    getUtcTimeSeconds,
} from "src/shared/pricing/utils";
import { CoingeckoPricingService } from "./providers/coingecko";
import { ChartType, Granularity } from "src/shared/domain";
import { connect } from "src/core/infra/postgres";
import { getToken } from "src/shared/integrations/providers/solana/getToken";
import {
    CandlestickChartPoint,
    ChartPoint,
    DateInfoForPricingProvider,
    LineChartPoint,
} from "./providers/types";
import { AssetPricePoint } from "./currentPriceService";
import { birdeye } from "src/utils/birdeye";
import { roundToNearestIncrementV2 } from "./providers/utils";
import { CoinGeckoTokenId } from "src/utils/coingecko/types";

const coingecko = new CoingeckoPricingService();

const ONLY_COINGECKO = new Set<string>([
    CoinGeckoTokenId.USDC,
    CoinGeckoTokenId.USDT,
    CoinGeckoTokenId.Solana,
]);

const getChartCurried =
    (type: ChartType) =>
    async (
        token: Token,
        granularity: Granularity
    ): Promise<FailureOrSuccess<DefaultErrors, AssetPricePoint[]>> => {
        if (
            token.chartProvider === "coingecko" &&
            ONLY_COINGECKO.has(token.coingeckoTokenId || "")
        ) {
            return _getChartByCoingeckoId(token, granularity, type);
        }

        // try getting the onchain data first
        if (
            token.chartProvider === "coingecko" &&
            token.contractAddress &&
            token.provider
        ) {
            const response = await _getChartByContract(
                token,
                granularity,
                type
            );

            if (response.isSuccess()) {
                return success(response.value);
            }
        }

        if (token.chartProvider === "coingecko" && token.coingeckoTokenId) {
            return _getChartByCoingeckoId(token, granularity, type);
        }

        return failure(new Error("Chart provider not supported."));
    };

const _getChartByCoingeckoId = async (
    token: Token,
    granularity: Granularity,
    chartType: ChartType
): Promise<FailureOrSuccess<DefaultErrors, AssetPricePoint[]>> => {
    if (!token.coingeckoTokenId) {
        return failure(new Error("Coingecko doesn't exist."));
    }

    // creation date of the token
    const tokenInfoResponse = await birdeye.getTokenSecurity(
        token.provider,
        token.contractAddress,
        true,
        "chartService -> getChartByCoingeckoId()"
    );

    if (tokenInfoResponse.isFailure()) {
        return failure(tokenInfoResponse.error);
    }

    const creationTime = tokenInfoResponse.value.creationTime
        ? new Date(Number(tokenInfoResponse.value.creationTime) * 1000)
        : null;

    const dateInfo = getDateInfoForGranularityV2(
        granularity,
        "UTC",
        // 10 years ago
        creationTime ?? moment().subtract({ years: 10 }).toDate()
    );

    if (!dateInfo) {
        return failure(new UnexpectedError("Invalid date info."));
    }

    const start = Date.now();

    if (chartType === ChartType.Line) {
        const response = await coingecko.getLineChart(dateInfo, {
            ...token,
            coinGeckoTokenId: token.coingeckoTokenId!,
            sourceType: "coingecko_id",
        });

        if (response.isFailure()) {
            return failure(response.error);
        }

        const pointsResponse = await _fillPoints(
            token,
            dateInfo,
            Object.values(response.value.points),
            creationTime
        );

        if (pointsResponse.isFailure()) {
            return failure(pointsResponse.error);
        }

        const points = pointsResponse.value;

        return success(points);
    }

    if (chartType === ChartType.Candlestick) {
        const response = await coingecko.getCandlestickChart(dateInfo, {
            ...token,
            coinGeckoTokenId: token.coingeckoTokenId!,
            sourceType: "coingecko_id",
        });

        if (response.isFailure()) {
            return failure(response.error);
        }

        const pointsResponse = await _fillPoints(
            token,
            dateInfo,
            Object.values(response.value.points),
            creationTime
        );

        if (pointsResponse.isFailure()) {
            return failure(pointsResponse.error);
        }

        const points = pointsResponse.value;

        return success(points);
    }

    return failure(new UnexpectedError("Chart type not supported."));
};

const _getChartByContract = async (
    token: Token,
    granularity: Granularity,
    chartType: ChartType
): Promise<FailureOrSuccess<DefaultErrors, AssetPricePoint[]>> => {
    if (!token.contractAddress || !token.provider) {
        return failure(
            new Error("Don't have enough information to get pricing chart.")
        );
    }

    // creation date of the token
    const tokenInfoResponse = await birdeye.getTokenSecurity(
        token.provider,
        token.contractAddress,
        true,
        "chartService -> getChartByContract()"
    );

    if (tokenInfoResponse.isFailure()) {
        return failure(tokenInfoResponse.error);
    }

    const creationTime = tokenInfoResponse.value.creationTime
        ? new Date(Number(tokenInfoResponse.value.creationTime) * 1000)
        : null;

    const dateInfo = getDateInfoForGranularityV2(
        granularity,
        "UTC",
        // 10 years ago
        creationTime ?? moment().subtract({ years: 10 }).toDate()
    );

    if (!dateInfo) {
        return failure(new UnexpectedError("Invalid date info."));
    }

    const start = Date.now();

    if (chartType === ChartType.Line) {
        const response = await coingecko.getLineChart(dateInfo, {
            ...token,
            coinGeckoTokenId: token.coingeckoTokenId,
            sourceType: "coingecko_contract_address",
        });

        if (response.isFailure()) {
            return failure(response.error);
        }

        const pointsResponse = await _fillPoints(
            token,
            dateInfo,
            Object.values(response.value.points),
            creationTime
        );

        if (pointsResponse.isFailure()) {
            return failure(pointsResponse.error);
        }

        const points = pointsResponse.value;

        return success(points);
    }

    if (chartType === ChartType.Candlestick) {
        const response = await coingecko.getCandlestickChart(dateInfo, {
            ...token,
            coinGeckoTokenId: token.coingeckoTokenId,
            sourceType: "coingecko_contract_address",
        });

        if (response.isFailure()) {
            return failure(response.error);
        }

        const pointsResponse = await _fillPoints(
            token,
            dateInfo,
            Object.values(response.value.points),
            creationTime
        );

        if (pointsResponse.isFailure()) {
            return failure(pointsResponse.error);
        }

        const points = pointsResponse.value;

        return success(points);
    }

    return failure(new UnexpectedError("Chart type not supported."));
};

const _fillPointsV1 = async (
    _token: Token,
    dateInfo: DateInfoForPricingProvider,
    chartPoints: ChartPoint[]
): Promise<FailureOrSuccess<DefaultErrors, AssetPricePoint[]>> => {
    const points = chartPoints.map(
        (p): AssetPricePoint => ({
            value: !isNil(p.priceCents)
                ? new BigNumber(p.priceCents).div(100)
                : null,
            valueCents: !isNil(p.priceCents)
                ? new BigNumber(p.priceCents)
                : null,
            timestamp: new Date(p.timestamp),
            utcTimeSeconds: getUtcTimeSeconds(new Date(p.timestamp), "UTC"),
            open: !isNil(p.openPriceCents)
                ? new BigNumber(p.openPriceCents).div(100)
                : null,
            close: !isNil(p.closePriceCents)
                ? new BigNumber(p.closePriceCents).div(100)
                : null,
            high: !isNil(p.highPriceCents)
                ? new BigNumber(p.highPriceCents).div(100)
                : null,
            low: !isNil(p.lowPriceCents)
                ? new BigNumber(p.lowPriceCents).div(100)
                : null,
        })
    );

    // only get the points after the first null. bc everything else before is prob nothing bc we just pass an arbitrary 10 year start date
    // for the all period chart
    const firstPricedPoint = points.findIndex((p) => p.value !== null);
    const validPoints = points.slice(firstPricedPoint);

    // fill in the points to the end of the time period with null values
    const allTimestamps = buildTimestampsBetweenRange({
        start: dateInfo.afterTz,
        end: dateInfo.beforeTz,
        increment: dateInfo.increment,
        dateTimeUnit: dateInfo.dateTimeUnit,
        timezone: dateInfo.timezone,
    });

    const timestampsToFill = allTimestamps.slice(validPoints.length);

    const newPoints = timestampsToFill.map(
        (ts): AssetPricePoint => ({
            timestamp: ts,
            value: null,
            valueCents: null,
            utcTimeSeconds: moment(ts).unix(),
            open: null,
            close: null,
            high: null,
            low: null,
        })
    );

    const allPoints = [...validPoints, ...newPoints];

    trackOk("coingecko.dex.charts.ok", 1);

    return success(allPoints);
};

const _fillPointsV2 = async (
    token: Token,
    dateInfo: DateInfoForPricingProvider,
    chartPoints: ChartPoint[],
    earliestDate: Date | null
): Promise<FailureOrSuccess<DefaultErrors, AssetPricePoint[]>> => {
    const points = chartPoints.map(
        (p): AssetPricePoint => ({
            value: !isNil(p.priceCents)
                ? new BigNumber(p.priceCents).div(100)
                : null,
            valueCents: !isNil(p.priceCents)
                ? new BigNumber(p.priceCents)
                : null,
            timestamp: new Date(p.timestamp),
            utcTimeSeconds: getUtcTimeSeconds(new Date(p.timestamp), "UTC"),
            open: !isNil(p.openPriceCents)
                ? new BigNumber(p.openPriceCents).div(100)
                : null,
            close: !isNil(p.closePriceCents)
                ? new BigNumber(p.closePriceCents).div(100)
                : null,
            high: !isNil(p.highPriceCents)
                ? new BigNumber(p.highPriceCents).div(100)
                : null,
            low: !isNil(p.lowPriceCents)
                ? new BigNumber(p.lowPriceCents).div(100)
                : null,
        })
    );

    // only get the points after the first null. bc everything else before is prob nothing bc we just pass an arbitrary 10 year start date
    // for the all period chart
    const firstPricedPoint =
        minBy(points, (p) => p.timestamp.getTime()) ?? null;

    // fill in the points to the end of the time period with null values
    const allTimestamps = buildTimestampsBetweenRange({
        start: dateInfo.afterTz,
        end: dateInfo.beforeTz,
        increment: dateInfo.increment,
        dateTimeUnit: dateInfo.dateTimeUnit,
        timezone: dateInfo.timezone,
    });

    const pointByTimestamp = points.reduce(
        (acc, p) => ({
            ...acc,
            [roundToNearestIncrementV2(
                p.timestamp,
                dateInfo,
                earliestDate
            ).toISOString()]: p,
        }),
        {} as Record<string, AssetPricePoint>
    );

    // start with the first indexed price point
    let mostRecentPoint = firstPricedPoint;

    const allPoints = allTimestamps
        .map((ts): AssetPricePoint | null => {
            // if the timestamp is before the earliest date, don't show it
            if (earliestDate && ts < earliestDate) {
                return null;
            }

            // if the granularity is all, don't include any timestamps that are less than the first point
            if (
                dateInfo.granularity === Granularity.All &&
                firstPricedPoint &&
                ts < firstPricedPoint.timestamp
            ) {
                return null;
            }

            // if the timestamp is after now / in the future, don't show it
            if (ts > new Date()) {
                return null;
            }

            // don't fill in any points before the first point
            // for now bc it will create flat lines to the left of the first point
            if (firstPricedPoint && ts < firstPricedPoint.timestamp) {
                return null;
            }

            const point = pointByTimestamp[ts.toISOString()];

            if (point) {
                mostRecentPoint = point;
                return point;
            }

            const result = {
                isFilled: true,
                timestamp: ts,
                value: mostRecentPoint?.value ?? null,
                valueCents: mostRecentPoint?.valueCents ?? null,
                utcTimeSeconds: getUtcTimeSeconds(ts, "UTC"),
                open: mostRecentPoint?.open ?? null,
                close: mostRecentPoint?.close ?? null,
                high: mostRecentPoint?.high ?? null,
                low: mostRecentPoint?.low ?? null,
            };

            return result;
        })
        .filter(hasValue);

    trackOk("coingecko.dex.charts.ok", 1);

    return success(allPoints);
};

const _fillPoints = _fillPointsV2;

const getLineChart = getChartCurried(ChartType.Line);

const getCandlestickChart = getChartCurried(ChartType.Candlestick);

export const ChartService = {
    getLineChart,
    getCandlestickChart,
};

// if running this file call getChart
// if (require.main === module) {
//     void connect()
//         .then(async () => {
//             const tokenResponse = await getToken({
//                 contractAddress: "9NQTAxdWAV8moypBkx6MtehRehAmeoKUK5YcJvkP4v6g",
//             });
//             const token = tokenResponse.value;

//             const response = await ChartService.getLineChart(
//                 token,
//                 Granularity.Day
//             );

//             console.log(JSON.stringify(response, null, 2));
//         })
//         .then(() => process.exit(0));
// }
