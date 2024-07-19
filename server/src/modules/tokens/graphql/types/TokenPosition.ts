import { nonNull, objectType } from "nexus";

export const TokenPosition = objectType({
    name: "TokenPosition",
    definition(t) {
        t.nonNull.boolean("isNativeToken");
        t.nullable.string("iconImageUrl");
        t.nullable.string("symbol");
        t.nonNull.float("amount");
        t.nonNull.float("priceCents");
        t.nonNull.float("fiatAmountCents");
        t.nonNull.string("fiatAmountFormatted");
        t.nonNull.string("fiatCurrency");
        t.nonNull.string("contractAddress");
        t.field("provider", {
            type: nonNull("AccountProviderEnum"),
        });
        t.nullable.string("coingeckoTokenId");
        t.nullable.float("avgCostBasisPerUnitCents");
        t.nullable.string("avgCostBasisPerUnitFormatted");
        t.nullable.float("totalCostBasisCents");
        t.nullable.string("totalCostBasisFormatted");
        t.nullable.float("totalReturnFiatCents");
        t.nullable.string("totalReturnFiatFormatted");
        t.nullable.float("totalReturnPercentage");
        t.nullable.boolean("isPending");
    },
});
