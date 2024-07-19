import { Dictionary } from "lodash";
import { DefaultErrors, FailureOrSuccess, Maybe } from "src/core/logic";
import BigNumber from "bignumber.js";
import { DateInfoForGranularity } from "src/shared/pricing/utils";
import { ChartType } from "src/shared/domain";
import { AccountProvider } from "src/core/infra/postgres/entities";

export type LineChartPoint = {
    priceCents: Maybe<string | number>;
    timestamp: string;
    utcTimeSeconds: number;
    // we artificially filled this price in. ex. NFT which could have a sale yesterday but not today,
    // so we assume the price was yesterdays
    isPriceFilled: boolean;
};

export type CandlestickChartPoint = {
    priceCents: Maybe<string | number>;
    openPriceCents: Maybe<string | number>;
    closePriceCents: Maybe<string | number>;
    highPriceCents: Maybe<string | number>;
    lowPriceCents: Maybe<string | number>;
    timestamp: string;
    utcTimeSeconds: number;
    // we artificially filled this price in. ex. NFT which could have a sale yesterday but not today,
    // so we assume the price was yesterdays
    isPriceFilled: boolean;
};

// the general chart point. could be line or candlestick. just inclusive of all the data
// kinda messy but just trying to move fast
export type ChartPoint = {
    priceCents: Maybe<string | number>;
    openPriceCents: Maybe<string | number>;
    closePriceCents: Maybe<string | number>;
    highPriceCents: Maybe<string | number>;
    lowPriceCents: Maybe<string | number>;
    timestamp: string;
    utcTimeSeconds: number;
    // we artificially filled this price in. ex. NFT which could have a sale yesterday but not today,
    // so we assume the price was yesterdays
    isPriceFilled: boolean;
};

export type ChartPointsByDate = {
    [date: string]: ChartPoint;
};

export type LineChartResponse = Promise<
    FailureOrSuccess<
        DefaultErrors,
        { points: ChartPointsByDate; earliestDate: Date | null }
    >
>;

export type CandlestickChartResponse = Promise<
    FailureOrSuccess<
        DefaultErrors,
        { points: ChartPointsByDate; earliestDate: Date | null }
    >
>;

export type DateInfoForPricingProvider = Pick<
    DateInfoForGranularity,
    | "granularity"
    | "afterTz"
    | "beforeTz"
    | "dateTimeUnit"
    | "increment"
    | "timezone"
    | "_afterUtc"
    | "_beforeUtc"
> & {
    numberOfBuckets: Maybe<number>;
};

export type RealtimeAssetPrice = {
    value: BigNumber;
    currency: string;
    isFiat: boolean;
};

export type RealtimeAssetPriceV2 = {
    priceCents: BigNumber;
    coinGeckoId: Maybe<string>;
    currency: string;
    isFiat: boolean;
    contractAddress: Maybe<string>;
    provider: Maybe<string>;
    dailyChangePercent: Maybe<BigNumber>;
    marketCapUsdCents: Maybe<BigNumber>;
    dailyChangePerUnitCents: Maybe<BigNumber>;
};

export type TokenInfo = {
    sourceType: "coingecko_id" | "coingecko_contract_address";
    coinGeckoTokenId: Maybe<string>;
    createdAt: Maybe<Date>;
    contractAddress: Maybe<string>;
    provider: Maybe<AccountProvider>;
};

export interface IAssetPricingProvider {
    name: string;
    getLineChart: (
        dateInfo: DateInfoForPricingProvider,
        asset: TokenInfo,
        type: ChartType
    ) => LineChartResponse;

    getCandlestickChart: (
        dateInfo: DateInfoForPricingProvider,
        asset: TokenInfo,
        type: ChartType
    ) => CandlestickChartResponse;

    getRealtimePriceInCentsForAsset: (
        asset: any,
        dateInfo: DateInfoForPricingProvider | null
    ) => Promise<FailureOrSuccess<DefaultErrors, Maybe<RealtimeAssetPrice>>>;
}

export type HistoricalPriceInfo = {
    priceCents: Maybe<BigNumber>;
    // isInTolerance: boolean;
    // toleranceDays: number;
    closestPriceDate: Maybe<Date>;
    hasPricing: boolean;
};
