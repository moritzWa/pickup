import { enumType, list, nonNull, objectType } from "nexus";
import { Category } from "src/core/infra/postgres/entities";

export const CategoryEnum = enumType({
    name: "CategoryEnum",
    members: Category,
});

export const SubcategoryInfo = objectType({
    name: "SubcategoryInfo",
    definition: (t) => {
        t.nonNull.string("label");
        t.nonNull.string("value");
    },
});

export const CategoryInfo = objectType({
    name: "CategoryInfo",
    definition: (t) => {
        t.nonNull.string("label");
        t.field("value", { type: nonNull("CategoryEnum") });
        t.nonNull.string("emoji");
        t.nullable.string("backgroundColor");
        t.nullable.string("textColor");
        t.list.field("subcategories", { type: nonNull(SubcategoryInfo) });
    },
});

export const CategorySection = objectType({
    name: "CategorySection",
    definition: (t) => {
        t.nonNull.string("label");
        t.nonNull.string("value");
        t.field("categories", {
            type: nonNull(list(nonNull("CategoryInfo"))),
        });
    },
});
