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
import { TokenPermission as TokenPermissionModel } from "src/core/infra/postgres/entities";
import { UserAuthProvider } from "src/core/infra/postgres/entities/User";
import { CHUNK_SIZE, dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type TokenPermissionResponse = FailureOrSuccess<
    DefaultErrors,
    TokenPermissionModel
>;
type TokenPermissionArrayResponse = FailureOrSuccess<
    DefaultErrors,
    TokenPermissionModel[]
>;
export type TokenPermissionParams = Omit<
    TokenPermissionModel,
    "id" | "categories" | "createdAt" | "updatedAt" | "user" | "token"
>;

export class PostgresTokenPermissionRepository {
    constructor(private model: typeof TokenPermissionModel) {}

    private get repo(): Repository<TokenPermissionModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<TokenPermissionModel>
    ): Promise<TokenPermissionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<TokenPermissionModel>
    ): Promise<TokenPermissionResponse> {
        try {
            const token = await this.repo.findOne(options);
            if (!token)
                return failure(new NotFoundError("TokenPermission not found."));
            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async exists(
        options: FindOneOptions<TokenPermissionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const exists = await this.repo.exist(options);

            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<TokenPermissionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async save(entry: TokenPermissionModel): Promise<TokenPermissionResponse> {
        try {
            const newLedgerEntry = await this.repo.save(entry);

            return success(newLedgerEntry);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        id: string,
        params: Partial<TokenPermissionParams>
    ): Promise<TokenPermissionResponse> {
        return Helpers.trySuccessFail(async () => {
            const updateResult = await this.repo.update(id, params);

            if (!updateResult.affected) {
                return failure(new NotFoundError("TokenPermission not found."));
            }

            const updatedToken = await this.repo.findOne({ where: { id } });

            if (!updatedToken) {
                return failure(new NotFoundError("TokenPermission not found."));
            }

            return success(updatedToken);
        });
    }

    async create(
        params: TokenPermissionParams,
        dbTxn?: EntityManager
    ): Promise<TokenPermissionResponse> {
        return Helpers.trySuccessFail(async () => {
            const obj = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);
            return success(obj);
        });
    }

    async createMany(
        paramsArr: TokenPermissionParams[],
        dbTxn?: EntityManager
    ): Promise<TokenPermissionArrayResponse> {
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
        tokens: TokenPermissionModel[]
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

    async findById(tokenId: string): Promise<TokenPermissionResponse> {
        try {
            const token = await this.repo
                .createQueryBuilder()
                .where("id = :tokenId", { tokenId })
                .getOne();

            if (!token) {
                return failure(new NotFoundError("TokenPermission not found."));
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
                return failure(new NotFoundError("TokenPermission not found."));
            }

            return success(!!updateResult.affected);
        });
    }
}
