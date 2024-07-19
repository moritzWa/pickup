import {
    DeleteResult,
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    getRepository,
    Repository,
    UpdateResult,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { Vote } from "src/core/infra/postgres/entities";
import { UserAuthProvider } from "src/core/infra/postgres/entities/User";
import {
    CHUNK_SIZE,
    dataSource,
    LARGER_CHUNK_SIZE,
} from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import _ = require("lodash");

type VoteResponse = FailureOrSuccess<DefaultErrors, Vote>;
type VoteArrayResponse = FailureOrSuccess<DefaultErrors, Vote[]>;
export type VoteParams = Omit<
    Vote,
    "id" | "token" | "user" | "createdAt" | "updatedAt"
>;

export class PostgresVoteRepository {
    constructor(private model: typeof Vote) {}

    private get repo(): Repository<Vote> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<Vote>,
        dbTxn?: EntityManager
    ): Promise<VoteArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = dbTxn
                ? await dbTxn.find(this.model, query)
                : await this.repo.find(query);
            return success(res);
        });
    }

    async findById(tokenId: string): Promise<VoteResponse> {
        try {
            const token = await this.repo
                .createQueryBuilder()
                .where("id = :tokenId", { tokenId })
                .getOne();

            if (!token) {
                return failure(new NotFoundError("Vote not found."));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findOne(
        options: FindOneOptions<Vote>,
        dbTxn?: EntityManager
    ): Promise<VoteResponse> {
        try {
            if (dbTxn) {
                const token = await dbTxn.findOne(this.model, options);
                if (!token)
                    return failure(new NotFoundError("Vote not found."));
                return success(token);
            }

            const token = await this.repo.findOne(options);
            if (!token) return failure(new NotFoundError("Vote not found."));
            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<Vote>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async update(
        voteId: string,
        updates: Partial<Vote>,
        dbTxn?: EntityManager
    ): Promise<FailureOrSuccess<DefaultErrors, UpdateResult>> {
        try {
            const result = dbTxn
                ? await dbTxn.update(this.model, { id: voteId }, updates)
                : await this.repo.update(voteId, updates);
            if (result.affected === 0) throw new Error("No vote was updated.");
            return success(result);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(
        objParams: VoteParams,
        dbTxn?: EntityManager
    ): Promise<VoteResponse> {
        try {
            const obj = dbTxn
                ? await dbTxn.save(this.model, objParams)
                : await this.repo.save(objParams);
            return success(obj);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async createMany(
        params: VoteParams[]
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
        objs: VoteParams[]
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

    async delete(
        where: FindOptionsWhere<Vote>
    ): Promise<FailureOrSuccess<DefaultErrors, DeleteResult>> {
        try {
            const deleteResponse = await this.repo.delete(where);
            return success(deleteResponse);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
