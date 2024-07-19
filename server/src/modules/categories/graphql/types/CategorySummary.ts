import { objectType, nonNull, list, enumType } from "nexus";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export const CategorySummary = objectType({
    name: "CategorySummary",
    definition(t) {
        t.nonNull.string("categoryName");
        t.nonNull.string("description");
        t.nonNull.string("slug");
        t.nullable.string("iconImageUrl");
        t.nullable.string("bannerImageUrl");
        t.nullable.float("totalMarketCap");
        t.nullable.float("totalVol24h");
        t.nullable.float("totalMarketCapChange");
        t.nullable.float("totalMarketCapChangePercentage");
        t.nullable.field("type", {
            type: nonNull("CategoryEnum"),
        });
        t.field("tokens", {
            type: nonNull(list(nonNull("DiscoverySplashResult"))),
        });
    },
});
