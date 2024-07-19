import {
    AccountProvider,
    CategoryEntry,
} from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { TradingIntegrationService } from "src/shared/integrations";
import { pgCategoryEntryRepo } from "../../infra/postgres";
import { FindManyOptions, FindOneOptions, FindOptionsWhere } from "typeorm";
import { CategoryEntryParams } from "../../infra/postgres/categoryEntryRepo";
import {
    getCategories,
    getBestCategories,
    getCategoryTokens,
    getCategoryTokensWithoutCache,
} from "./getCategoryTokens";

const findOne = async (options: FindOneOptions<CategoryEntry>) =>
    pgCategoryEntryRepo.findOne(options);

const find = async (options: FindManyOptions<CategoryEntry>) =>
    pgCategoryEntryRepo.find(options);

const save = async (obj: CategoryEntryParams) => pgCategoryEntryRepo.save(obj);

const saveMany = async (objs: CategoryEntryParams[]) =>
    pgCategoryEntryRepo.saveMany(objs);

const deleteMany = async (where: FindOptionsWhere<CategoryEntry>) =>
    pgCategoryEntryRepo.delete(where);

const createMany = async (params: CategoryEntryParams[]) => {
    return pgCategoryEntryRepo.createMany(params);
};

export const CategoryEntryService = {
    find,
    findOne,
    save,
    saveMany,
    createMany,
    deleteMany,
    getCategories,
    getBestCategories,
    getCategoryTokens,
    getCategoryTokensWithoutCache,
};
