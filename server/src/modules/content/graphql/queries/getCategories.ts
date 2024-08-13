import { list, nonNull, objectType, queryField } from "nexus";
import { CATEGORIES } from "../../services/categories";

export const getCategories = queryField("getCategories", {
    type: nonNull(list(nonNull("CategorySection"))),
    resolve: () => CATEGORIES,
});
