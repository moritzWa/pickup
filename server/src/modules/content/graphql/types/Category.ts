import { enumType, nonNull, objectType } from "nexus";
import { Category } from "src/core/infra/postgres/entities";

export const CategoryEnum = enumType({
    name: "CategoryEnum",
    members: Category,
});

export const CategoryInfo = objectType({
    name: "CategoryInfo",
    definition: (t) => {
        t.nonNull.string("label");
        t.field("value", { type: nonNull("CategoryEnum") });
        t.nonNull.string("emoji");
        t.nullable.string("backgroundColor");
        t.nullable.string("textColor");
    },
});
