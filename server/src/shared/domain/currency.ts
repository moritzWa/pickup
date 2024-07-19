import { Currency as DineroCurrency } from "dinero.js";
import { CurrencyCode } from "src/core/infra/postgres/entities";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export type GQLCurrencyCodeEnum = NexusGenEnums["CurrencyCodeEnum"];

export { CurrencyCode as Currency, CurrencyCode };
