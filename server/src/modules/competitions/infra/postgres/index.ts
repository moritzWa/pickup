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
import { Competition } from "src/core/infra/postgres/entities";
import { UserAuthProvider } from "src/core/infra/postgres/entities/User";
import {
    CHUNK_SIZE,
    dataSource,
    LARGER_CHUNK_SIZE,
} from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import _ = require("lodash");

type CompetitionResponse = FailureOrSuccess<DefaultErrors, Competition>;
type CompetitionArrayResponse = FailureOrSuccess<DefaultErrors, Competition[]>;
export type CompetitionParams = Omit<
    Competition,
    "id" | "token1" | "token2" | "createdAt" | "updatedAt"
>;

export class PostgresCompetitionRepository {
    constructor(private model: typeof Competition) {}

    private get repo(): Repository<Competition> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<Competition>
    ): Promise<CompetitionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findById(tokenId: string): Promise<CompetitionResponse> {
        try {
            const token = await this.repo
                .createQueryBuilder()
                .where("id = :tokenId", { tokenId })
                .getOne();

            if (!token) {
                return failure(new NotFoundError("Competition not found."));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findOne(
        options: FindOneOptions<Competition>
    ): Promise<CompetitionResponse> {
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
        options: FindManyOptions<Competition>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async save(entry: CompetitionParams): Promise<CompetitionResponse> {
        try {
            const newLedgerEntry = await this.repo.save(entry);

            return success(newLedgerEntry);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async createMany(
        params: CompetitionParams[]
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
        objs: CompetitionParams[]
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
        where: FindOptionsWhere<Competition>
    ): Promise<FailureOrSuccess<DefaultErrors, DeleteResult>> {
        try {
            const deleteResponse = await this.repo.delete(where);
            return success(deleteResponse);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
