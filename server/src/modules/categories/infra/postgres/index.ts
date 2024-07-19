import {
    CategoryEntry,
    Token,
    TokenPermission,
} from "src/core/infra/postgres/entities";
import { PostgresCategoryEntryRepository } from "./categoryEntryRepo";

export const pgCategoryEntryRepo = new PostgresCategoryEntryRepository(
    CategoryEntry
);
