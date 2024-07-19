import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { isNil } from "lodash";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";

export const AssetAccountBreakdown = objectType({
    name: "AssetAccountBreakdown",
    definition(t) {
        t.nonNull.string("accountId");
        t.nonNull.string("assetId");
        t.nonNull.float("amount");
        t.nonNull.float("costBasisFiatAmount");
        t.nullable.float("currentFiatAmount");
        t.nullable.float("estimatedCurrentValue"); // what we render in the UI
        t.nullable.float("gainOrLossFiatAmount");
        t.nullable.float("percentChangeAllTime");
        t.nonNull.boolean("hasPrice");
        t.nullable.float("avgBasisFiatAmount");
        t.nullable.float("currentTokenPriceFiatAmount");
    },
});

export const PortfolioPosition = objectType({
    name: "PortfolioPosition",
    definition(t) {
        t.nonNull.string("symbol");
        t.field("provider", {
            type: nonNull("AccountProviderEnum"),
        });
        t.nonNull.string("contractAddress");
        t.nonNull.string("iconImageUrl");
        t.nonNull.float("amount");
        t.nonNull.float("fiatAmountCents");
        t.nonNull.string("fiatCurrency");
        t.nullable.float("dailyChangePercentage");
        t.nullable.float("dailyChangePerUnitCents");
        t.nullable.float("dailyFiatAmountCents");
        t.nullable.string("dailyPercentageFormatted");
        t.nonNull.boolean("canSelectToken"); // for the modal
    },
});
