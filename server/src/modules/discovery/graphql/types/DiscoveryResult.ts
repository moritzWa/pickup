import { objectType, nonNull, list, enumType } from "nexus";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";
import { DiscoveryResultTypeEnum } from "./DiscoveryResultType";

export const DiscoveryResult = objectType({
    name: "DiscoveryResult",
    definition(t) {
        t.nullable.string("coinGeckoTokenId");
        t.nonNull.string("name");
        t.nonNull.string("symbol");
        t.nullable.string("iconImageUrl");
        t.nonNull.string("contractAddress");
        t.field("provider", { type: nonNull("AccountProviderEnum") });
        t.nonNull.field("type", { type: DiscoveryResultTypeEnum });
        t.nullable.float("price");
        t.nullable.string("priceFormatted");
        t.nullable.float("priceChangePercentage24h");
        t.nullable.string("priceChangePercentage24hFormatted");
        t.nullable.boolean("isStrict");
        t.nullable.boolean("isClaimed");
        t.nullable.boolean("isMovementVerified");
        t.nullable.boolean("isDead");
        t.nullable.string("marketCap");
        t.nullable.string("vol24h");
    },
});
