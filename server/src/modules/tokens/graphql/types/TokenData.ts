import { objectType, nonNull, list, enumType } from "nexus";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export const TokenData = objectType({
    name: "TokenData",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("name");
        t.nonNull.string("symbol");
        t.nonNull.string("contractAddress");
        t.nonNull.string("iconImageUrl");
        t.field("provider", { type: nonNull("AccountProviderEnum") });
        t.nullable.string("coinGeckoTokenId");
        t.nullable.string("priceFormatted");
        t.nullable.float("priceChangePercentage24h");
        t.nullable.string("priceChangePercentage24hFormatted");
        t.nullable.boolean("isStrict");
        t.nullable.boolean("isMovementVerified");
        t.nullable.boolean("isDead");
        t.nullable.boolean("isClaimed");
        t.nullable.string("marketCap");
        t.nullable.string("vol24h");
    },
});
