import BigNumber from "bignumber.js";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";

export const shouldIncludePosition = (
    a: NexusGenObjects["PortfolioPosition"]
): boolean =>
    new BigNumber(a.fiatAmountCents).dp(0).gt(0) ||
    new BigNumber(a.amount).dp(0).gt(0.01);
