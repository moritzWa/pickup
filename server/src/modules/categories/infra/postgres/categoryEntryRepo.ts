import {
    DeleteResult,
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    getRepository,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { CategoryEntry as CategoryEntry } from "src/core/infra/postgres/entities";
import { UserAuthProvider } from "src/core/infra/postgres/entities/User";
import {
    CHUNK_SIZE,
    dataSource,
    LARGER_CHUNK_SIZE,
} from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import _ = require("lodash");

type CategoryEntryResponse = FailureOrSuccess<DefaultErrors, CategoryEntry>;
type CategoryEntryArrayResponse = FailureOrSuccess<
    DefaultErrors,
    CategoryEntry[]
>;
export type CategoryEntryParams = Omit<
    CategoryEntry,
    "id" | "token" | "createdAt" | "updatedAt"
>;

export class PostgresCategoryEntryRepository {
    constructor(private model: typeof CategoryEntry) {}

    private get repo(): Repository<CategoryEntry> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<CategoryEntry>
    ): Promise<CategoryEntryArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<CategoryEntry>
    ): Promise<CategoryEntryResponse> {
        try {
            const token = await this.repo.findOne(options);
            if (!token)
                return failure(new NotFoundError("Category not found."));
            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<CategoryEntry>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async save(entry: CategoryEntryParams): Promise<CategoryEntryResponse> {
        try {
            const newLedgerEntry = await this.repo.save(entry);

            return success(newLedgerEntry);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    upsertForToken = async (
        tokenId: string,
        entry: Omit<CategoryEntryParams, "tokenId" | "token">
    ): Promise<CategoryEntryResponse> => {
        try {
            const existingEntry = await this.repo.findOne({
                where: {
                    tokenId,
                },
            });

            if (existingEntry) {
                const updatedEntry = await this.repo.save({
                    ...existingEntry,
                    tokenId,
                    ...entry,
                });

                return success(updatedEntry);
            }

            const newEntry = await this.repo.save({ ...entry, tokenId });

            return success(newEntry);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    async createMany(
        params: CategoryEntryParams[]
    ): Promise<FailureOrSuccess<DefaultErrors, null>> {
        try {
            const chunks = _.chunk(params, LARGER_CHUNK_SIZE);

            for (const chunk of chunks) {
                await this.repo
                    .createQueryBuilder()
                    .insert()
                    .into(this.model)
                    .values(chunk)
                    .execute();
            }

            return success(null);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async saveMany(
        objs: CategoryEntryParams[]
    ): Promise<FailureOrSuccess<DefaultErrors, null>> {
        try {
            await this.repo.save(objs, {
                chunk: CHUNK_SIZE,
            });

            return success(null);
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    }

    async findById(tokenId: string): Promise<CategoryEntryResponse> {
        try {
            const token = await this.repo
                .createQueryBuilder()
                .where("id = :tokenId", { tokenId })
                .getOne();

            if (!token) {
                return failure(new NotFoundError("CategoryEntry not found."));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async delete(
        where: FindOptionsWhere<CategoryEntry>
    ): Promise<FailureOrSuccess<DefaultErrors, DeleteResult>> {
        try {
            const deleteResponse = await this.repo.delete(where);
            return success(deleteResponse);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
