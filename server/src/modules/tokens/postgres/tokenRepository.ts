import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { Token as TokenModel } from "src/core/infra/postgres/entities";
import { UserAuthProvider } from "src/core/infra/postgres/entities/User";
import {
    CHUNK_SIZE,
    dataSource,
    LARGER_CHUNK_SIZE,
} from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type TokenResponse = FailureOrSuccess<DefaultErrors, TokenModel>;
type TokenArrayResponse = FailureOrSuccess<DefaultErrors, TokenModel[]>;
export type TokenParams = Omit<
    TokenModel,
    "id" | "categories" | "createdAt" | "updatedAt"
>;

export class PostgresTokenRepository {
    constructor(private model: typeof TokenModel) {}

    private get repo(): Repository<TokenModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<TokenModel>
    ): Promise<TokenArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(options: FindOneOptions<TokenModel>): Promise<TokenResponse> {
        try {
            const token = await this.repo.findOne(options);
            if (!token) return failure(new NotFoundError("Token not found."));
            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async exists(
        options: FindOneOptions<TokenModel>
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const exists = await this.repo.exist(options);
            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<TokenModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async save(entry: TokenModel): Promise<TokenResponse> {
        try {
            const newLedgerEntry = await this.repo.save(entry);

            return success(newLedgerEntry);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: TokenParams,
        dbTxn?: EntityManager
    ): Promise<TokenResponse> {
        return Helpers.trySuccessFail(async () => {
            const obj = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);
            return success(obj);
        });
    }

    async update(
        id: string,
        updates: Partial<TokenParams>,
        dbTxn?: EntityManager
    ): Promise<TokenResponse> {
        return Helpers.trySuccessFail(async () => {
            const updateResult = dbTxn
                ? await dbTxn.update(this.model, id, updates)
                : await this.repo.update(id, updates);

            if (!updateResult) {
                return failure(new NotFoundError("Token not found."));
            }

            return success(updateResult);
        });
    }

    async createMany(
        paramsArr: TokenParams[],
        dbTxn?: EntityManager
    ): Promise<TokenArrayResponse> {
        try {
            const objs = dbTxn
                ? await dbTxn.save(this.model, paramsArr)
                : await this.repo.save(paramsArr);
            return success(objs);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async saveMany(
        tokens: TokenModel[]
    ): Promise<FailureOrSuccess<DefaultErrors, null>> {
        try {
            await this.repo.save(tokens, {
                chunk: CHUNK_SIZE,
            });

            return success(null);
        } catch (err) {
            console.error(err);
            return failure(new UnexpectedError(err));
        }
    }

    async findById(tokenId: string): Promise<TokenResponse> {
        try {
            const token = await this.repo
                .createQueryBuilder()
                .where("id = :tokenId", { tokenId })
                .getOne();

            if (!token) {
                return failure(new NotFoundError("Token not found."));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async deleteById(
        id: string
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        return Helpers.trySuccessFail(async () => {
            const updateResult = await this.repo.delete({
                id,
            });

            if (!updateResult) {
                return failure(new NotFoundError("Token not found."));
            }

            return success(!!updateResult.affected);
        });
    }
}
