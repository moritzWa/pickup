// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-05-16-category_entries.ts

import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { Category as CategoryType } from "src/core/infra/postgres/entities/Token";
import { DefaultErrors, FailureOrSuccess, success } from "src/core/logic";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { POLITICS } from "src/modules/categories/services/categoryService/categories/POLITICS";
import { RELIGION } from "src/modules/categories/services/categoryService/categories/RELIGION";
import { UNITED_NATIONS } from "src/modules/categories/services/categoryService/categories/UNITED_NATIONS";
import { Category } from "src/modules/categories/services/categoryService/categories/types";
import { CategoryEntryParams } from "src/modules/categories/infra/postgres/categoryEntryRepo";
import { CategoryEntryService } from "src/modules/categories/services/categoryService";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";

const categories = [UNITED_NATIONS, POLITICS, RELIGION];

export const run = async () => {
    for (const c of categories) {
        const resp = await _saveCategoryEntries(c);
        throwIfError(resp);
    }
};

const _saveCategoryEntries = async (
    category: Category
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    const categoryEntryParams: CategoryEntryParams[] = [];

    // add united nations to  category
    for (const unToken of category.tokens) {
        // find token in DB
        const tokenDBResp = await TokenService.findOne({
            where: {
                provider: AccountProvider.Solana,
                contractAddress: unToken.contractAddress,
            },
        });
        throwIfError(tokenDBResp);
        const tokenDB = tokenDBResp.value;

        const c =
            category.name === "United Nations"
                ? CategoryType.UnitedNations
                : category.name === "Politics"
                ? CategoryType.Politics
                : category.name === "Religion"
                ? CategoryType.Religion
                : null;

        if (!c) throw new Error("No name found");

        // create new category entry for it
        categoryEntryParams.push({
            category: c,
            tokenId: tokenDB.id,
            name: unToken.name,
        });
    }

    // create all entries
    const saveResp = await CategoryEntryService.saveMany(categoryEntryParams);
    throwIfError(saveResp);
    console.log("Saved all category entries");

    return success(null);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
