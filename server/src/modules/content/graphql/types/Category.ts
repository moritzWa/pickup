import { enumType, objectType } from "nexus";
import { CATEGORIES } from "../../services/categories";

// Create a mapping between user-friendly names and GraphQL-valid enum names
const categoryNameToEnumName = (name: string) =>
    name.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();

// Create an object with GraphQL-valid enum names as keys and user-friendly names as values
const categoryEnumValues = Object.fromEntries(
    CATEGORIES.flatMap((section) =>
        section.categories.map((category) => [
            categoryNameToEnumName(category.name),
            category.name,
        ])
    )
);

export const CategoryEnum = enumType({
    name: "CategoryEnum",
    members: categoryEnumValues,
});

export const Category = objectType({
    name: "Category",
    definition(t) {
        t.nonNull.string("name");
        t.nonNull.string("emoji");
        t.nonNull.list.nonNull.string("subcategories");
    },
});

export const CategorySection = objectType({
    name: "CategorySection",
    definition(t) {
        t.nonNull.string("name");
        t.nonNull.list.nonNull.field("categories", { type: Category });
    },
});
