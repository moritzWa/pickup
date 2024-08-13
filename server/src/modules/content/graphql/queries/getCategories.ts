import { list, nonNull, queryField } from "nexus";
import { CATEGORIES } from "../../services/categories";
import { CategorySectionType } from "../types";

export const getCategories = queryField("getCategories", {
    type: nonNull(list(nonNull(CategorySectionType))),
    resolve: () => CATEGORIES,
});
