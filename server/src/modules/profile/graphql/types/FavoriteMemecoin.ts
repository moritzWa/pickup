import { enumType, list, nonNull, nullable, objectType } from "nexus";

export const FavoriteMemecoin = objectType({
    name: "FavoriteMemecoin",
    definition(t) {
        t.nonNull.string("name");
        t.nonNull.string("symbol");
        t.nullable.string("iconImageUrl");
        t.nonNull.string("contractAddress");
        t.field("provider", {
            type: nonNull("AccountProviderEnum"),
        });
    },
});
