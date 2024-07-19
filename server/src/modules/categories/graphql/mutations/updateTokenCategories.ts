import { ApolloError } from "apollo-server-errors";
import {
    list,
    mutationField,
    nonNull,
    nullable,
    objectType,
    stringArg,
} from "nexus";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { WatchlistAssetService } from "src/modules/watchlist/services/watchlistAssetService";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { CategoryEntryService } from "../../services";
import { In } from "typeorm";
import {
    Category,
    getCategoryMetadata,
} from "src/core/infra/postgres/entities/Token";
import { algolia } from "src/utils/algolia";

export const UpdateTokenCategoriesResponse = objectType({
    name: "UpdateTokenCategoriesResponse",
    definition(t) {
        t.nonNull.field("categories", {
            type: nonNull(list(nonNull("CategoryMetadata"))),
        });
    },
});

export const updateTokenCategories = mutationField("updateTokenCategories", {
    type: nonNull("UpdateTokenCategoriesResponse"),
    args: {
        tokenId: nonNull("ID"),
        categories: nonNull(list(nonNull("CategoryEnum"))),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { tokenId, categories } = args;
        throwIfNotAuthenticated(ctx);
        const user = ctx.me!;

        if (!user.isSuperuser) {
            throw new ApolloError("Not authorized to update token categories");
        }

        // get existing categories
        const currentCategoriesResp = await CategoryEntryService.find({
            where: {
                tokenId,
            },
        });
        throwIfError(currentCategoriesResp);
        const currentCategories = currentCategoriesResp.value;

        // find ones to delete and ones to add
        const categoriesToDelete = currentCategories.filter(
            (c) => !categories.includes(c.category)
        );
        const categoriesToAdd = categories.filter(
            (c) =>
                !currentCategories
                    .map((cc) => cc.category)
                    .includes(c as Category)
        );

        // add to categories
        if (categoriesToAdd.length > 0) {
            const createResp = await CategoryEntryService.createMany(
                categoriesToAdd.map((c) => ({
                    tokenId,
                    category: c as Category,
                    name: "", // deprecated
                }))
            );
            throwIfError(createResp);
        }

        // delete categories
        if (categoriesToDelete.length > 0) {
            const deleteResp = await CategoryEntryService.deleteMany({
                id: In(categoriesToDelete.map((c) => c.id)),
            });
            throwIfError(deleteResp);
            const numAffected = deleteResp.value.affected;
        }

        // get updated categories
        const updatedCategoriesResp = await CategoryEntryService.find({
            where: {
                tokenId,
            },
        });
        throwIfError(updatedCategoriesResp);
        const updatedCategories = updatedCategoriesResp.value;

        // update algolia categories
        await algolia.categories.save(
            updatedCategories.map((c) => ({
                objectID: c.category,
                type: c.category,
                description: getCategoryMetadata(c.category).description,
                slug: getCategoryMetadata(c.category).slug,
                bannerImageUrl: getCategoryMetadata(c.category).bannerImageUrl,
                categoryName: getCategoryMetadata(c.category).categoryName,
                iconImageUrl: getCategoryMetadata(c.category).iconImageUrl,
            }))
        );

        return {
            categories: updatedCategories.map((c) =>
                getCategoryMetadata(c.category)
            ),
        };
    },
});
