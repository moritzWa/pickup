import { enumType } from "nexus";
import {
    TradingProvider,
    TradingSide,
} from "src/core/infra/postgres/entities/types";

export const TradingProviderEnum = enumType({
    name: "TradingProviderEnum",
    members: TradingProvider,
});

export const TradingSideEnum = enumType({
    name: "TradingSideEnum",
    members: TradingSide,
});
