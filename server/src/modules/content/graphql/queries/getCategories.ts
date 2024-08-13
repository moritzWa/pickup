import { list, nonNull, objectType, queryField } from "nexus";
import { CATEGORIES } from "../../services/categories";
import { CategorySectionType } from "../types";

export const CategorySection = objectType({
    name: "CategorySection",
    definition(t) {
        t.nonNull.string("name");
        t.nonNull.list.nonNull.field("categories", { type: Category });
    },
});

export const Category = objectType({
    name: "Category",
    definition(t) {
        t.nonNull.string("name");
        t.nonNull.string("emoji");
        t.nonNull.list.nonNull.string("subcategories");
    },
});

export const getCategories = queryField("getCategories", {
    type: nonNull(list(nonNull(CategorySectionType))),
    resolve: () => CATEGORIES,
});
