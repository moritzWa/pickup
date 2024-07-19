import BigNumber from "bignumber.js";
import { enumType, nonNull, nullable, objectType } from "nexus";

export const Token = objectType({
    name: "Token",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("symbol");
        t.nonNull.string("iconImageUrl");
        t.nonNull.string("contractAddress");
        t.nullable.string("coingeckoId");
        t.field("provider", {
            type: nonNull("AccountProviderEnum"),
        });
    },
});
