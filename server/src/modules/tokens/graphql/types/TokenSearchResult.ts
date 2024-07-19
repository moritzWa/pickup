import { nonNull, objectType } from "nexus";

export const TokenSearchResult = objectType({
    name: "TokenSearchResult",
    definition(t) {
        t.nonNull.string("symbol");
        t.nonNull.string("name");
        t.nullable.string("iconImageUrl");
        t.nonNull.string("contractAddress");
        t.nullable.string("coingeckoId");
        t.field("provider", {
            type: nonNull("AccountProviderEnum"),
        });
    },
});
