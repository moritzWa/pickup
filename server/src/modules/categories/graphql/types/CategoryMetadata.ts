import { nonNull, objectType } from "nexus";

export const CategoryMetadata = objectType({
    name: "CategoryMetadata",
    definition(t) {
        t.nonNull.field("type", {
            type: nonNull("CategoryEnum"),
        });
        t.nullable.string("categoryName");
        t.nullable.string("description");
        t.nullable.string("slug");
        t.nullable.string("iconImageUrl");
        t.nullable.string("bannerImageUrl");
    },
});
