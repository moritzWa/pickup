import { Datadog, coingecko, logHistogram } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";
import moment = require("moment");
import { connect } from "src/core/infra/postgres";
import { SyncJupiterTokensService } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService";
import { CategoryEntryService } from "src/modules/categories/services";
import { throwIfError } from "src/core/surfaces/graphql/common";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { Category } from "src/core/infra/postgres/entities/Token";
import { CategoriesCacheService } from "src/modules/categories/services/categoryService/categoriesCacheService";

// warm a few categories every 1 minute
const CRON = "*/1 * * * *";
const NAME = "Warm Categories";

const NUM_CATEGORIES_TO_WARM = 5;

const warmCategories = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async ({ step }) => {
        const start = Date.now();

        const warmCategoriesResp = await _warmCategories();
        if (warmCategoriesResp.isFailure())
            throw new Error(warmCategoriesResp.error.message);

        const end = Date.now();

        logHistogram({
            metric: "warm_categories.duration",
            value: end - start,
            logIfOver: 30_000,
        });

        console.log(`Successfully synced jupiter tokens.`);
    }
);

export const _warmCategories = async (): Promise<
    FailureOrSuccess<DefaultErrors, number>
> => {
    const categories = Object.keys(Category);

    // pick a few without cache
    const categoriesWithoutCache: Category[] = [];
    for (const _category of categories) {
        const category: Category = Category[_category as Category];
        const cacheResp = await CategoriesCacheService.exists(category);
        if (cacheResp.isFailure()) return failure(cacheResp.error);
        const exists = cacheResp.value;
        if (!exists) categoriesWithoutCache.push(category);
        if (categoriesWithoutCache.length === NUM_CATEGORIES_TO_WARM) break;
    }

    // get tokens and store in cache
    let successes = 0;
    for (const categoryWithoutCache of categoriesWithoutCache) {
        // get tokens
        const categoryTokensResp =
            await CategoryEntryService.getCategoryTokensWithoutCache(
                categoryWithoutCache
            );
        if (categoryTokensResp.isFailure())
            return failure(categoryTokensResp.error);
        const categoryTokens = categoryTokensResp.value;

        // store in cache
        if (!categoryTokens.slug)
            return failure(
                new Error(
                    "Category does not have slug: " +
                        categoryWithoutCache.toString()
                )
            );
        const setCacheResponse = await CategoriesCacheService.set(
            categoryWithoutCache,
            categoryTokens
        );
        if (setCacheResponse.isFailure()) console.error(setCacheResponse.error);

        successes += 1;
    }

    if (successes !== categoriesWithoutCache.length)
        return failure(
            new Error(
                "There were " +
                    successes +
                    " less successes than attempts to update categories cache in warmCategories"
            )
        );

    return success(successes);
};

export { warmCategories };

// if we are calling this file call the above function
if (require.main === module) {
    connect()
        .then(async () => {
            await SyncJupiterTokensService.fetchNewJupiterTokens();
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
