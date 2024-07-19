import { list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Category,
    CategoryMetadata,
    getCategoryMetadata,
} from "src/core/infra/postgres/entities/Token/CategoryEntry";

export const GetCategoryTypesResponse = objectType({
    name: "GetCategoryTypesResponse",
    definition(t) {
        t.nonNull.field("categories", {
            type: nonNull(list(nonNull("CategoryMetadata"))),
        });
    },
});

export const getCategoryTypes = queryField("getCategoryTypes", {
    type: nonNull("GetCategoryTypesResponse"),
    resolve: async (_parent, args, ctx) => {
        const types = Object.keys(Category);

        const metadatas: CategoryMetadata[] = types.map((t) => {
            const category = Category[t as Category];
            return getCategoryMetadata(category);
        });

        return {
            categories: metadatas,
        };
    },
});
