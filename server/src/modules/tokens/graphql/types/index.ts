import { enumType } from "nexus";
import { MemecoinLinkType } from "src/core/infra/postgres/entities/Token";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";
import { ChartType, Granularity } from "src/shared/domain";

export * from "./TokenInfo";
export * from "./TokenChartPoint";
export * from "./TokenSearchResult";
export * from "./TokenPosition";
export * from "./TokenAddressAndProvider";
export * from "./GetMarketCapsAndVolumesResponse";
export * from "./MemecoinLink";
export * from "./TokenPermission";
export * from "./TokenData";
export * from "./LargestHolder";

// enums
export const GranularityEnum = enumType({
    name: "GranularityEnum",
    members: Granularity,
});

export const GRANULARITY_GQL_TO_DOMAIN: Record<
    NexusGenEnums["GranularityEnum"],
    Granularity
> = {
    hour: Granularity.Hour,
    day: Granularity.Day,
    week: Granularity.Week,
    month: Granularity.Month,
    year: Granularity.Year,
    all: Granularity.All,
    three_month: Granularity.ThreeMonth,
    ytd: Granularity.YearToDate,
};

export const ChartTypeEnum = enumType({
    name: "ChartTypeEnum",
    members: ["candlestick", "line"],
});

export const CHART_TYPE_GQL_TO_DOMAIN: Record<
    NexusGenEnums["ChartTypeEnum"],
    ChartType
> = {
    candlestick: ChartType.Candlestick,
    line: ChartType.Line,
};

// enums
export const MemecoinLinkTypeEnum = enumType({
    name: "MemecoinLinkTypeEnum",
    members: MemecoinLinkType,
});

export const MEMECOIN_LINK_TYPE_GQL_TO_DOMAIN: Record<
    NexusGenEnums["MemecoinLinkTypeEnum"],
    MemecoinLinkType
> = {
    twitter: MemecoinLinkType.Twitter,
    telegram: MemecoinLinkType.Telegram,
    website: MemecoinLinkType.Website,
    solscan: MemecoinLinkType.Solscan,
    discord: MemecoinLinkType.Discord,
    coingecko: MemecoinLinkType.Coingecko,
    medium: MemecoinLinkType.Medium,
    dexscreener: MemecoinLinkType.DexScreener,
    instagram: MemecoinLinkType.Instagram,
    reddit: MemecoinLinkType.Reddit,
    tiktok: MemecoinLinkType.TikTok,
    youtube: MemecoinLinkType.YouTube,
    email: MemecoinLinkType.Email,
    birdeye: MemecoinLinkType.Birdeye,
    raydium: MemecoinLinkType.Raydium,
    jupiter: MemecoinLinkType.Jupiter,
    dextools: MemecoinLinkType.DexTools,
    coingecko_dex: MemecoinLinkType.CoinGeckoDEX,
    spotify: MemecoinLinkType.Spotify,
};
