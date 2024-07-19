import { enumType } from "nexus";
import { AccountProvider } from "src/core/infra/postgres/entities";

export * from "./currency";
export * from "./blockchain";
export * from "./algorithms";
export * from "./country";

export enum Granularity {
    Hour = "hour",
    Day = "day",
    Week = "week",
    Month = "month",
    ThreeMonth = "three_month",
    YearToDate = "ytd",
    Year = "year",
    All = "all",
}

export enum ChartType {
    Candlestick = "candlestick",
    Line = "line",
}
