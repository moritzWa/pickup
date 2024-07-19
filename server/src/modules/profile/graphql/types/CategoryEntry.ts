import { enumType, list, nonNull, nullable, objectType } from "nexus";
import {
    categoryEnumToName,
    getCategorySlug,
} from "src/core/infra/postgres/entities/Token";

export const CategoryEntry = objectType({
    name: "CategoryEntry",
    definition(t) {
        t.nonNull.id("tokenId");
        t.nonNull.field("category", {
            type: nonNull("CategoryEnum"),
        });
        t.nullable.string("slug", {
            resolve: (p) => getCategorySlug(p.category),
        });
        t.nonNull.string("categoryName", {
            resolve: (p) => {
                return categoryEnumToName(p.category);
            },
        });
    },
});
