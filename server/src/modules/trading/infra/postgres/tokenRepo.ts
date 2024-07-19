import {
    EntityManager,
    FindManyOptions,
    getRepository,
    InsertResult,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    AccountProvider,
    Token as TokenModel,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type TokenResponse = FailureOrSuccess<DefaultErrors, TokenModel>;
type TokenArrayResponse = FailureOrSuccess<DefaultErrors, TokenModel[]>;

export class PostgresTokenRepository {
    constructor(private model: typeof TokenModel) {}

    private get repo(): Repository<TokenModel> {
        return dataSource.getRepository(this.model);
    }

    async findByContractAddressAndProvider(
        contractAddress: string,
        provider: AccountProvider
    ): Promise<TokenResponse> {
        try {
            const token = await this.repo.findOne({
                where: {
                    contractAddress,
                    provider,
                },
            });

            if (!token) {
                return failure(new NotFoundError("Token not found."));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByCoingeckoAndProvider(
        coingeckoId: string,
        provider: AccountProvider
    ): Promise<TokenResponse> {
        try {
            const token = await this.repo.findOne({
                where: {
                    coingeckoId,
                    provider,
                },
            });

            if (!token) {
                return failure(new NotFoundError("Token not found."));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
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

    async count(
        options: FindManyOptions<TokenModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        tokenId: string,
        opts?: FindManyOptions<TokenModel>
    ): Promise<TokenResponse> {
        try {
            const token = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    id: tokenId,
                },
            });

            if (!token) {
                return failure(new NotFoundError("Token not found."));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findBySlug(
        slug: string,
        opts?: FindManyOptions<TokenModel>
    ): Promise<TokenResponse> {
        try {
            const token = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    slug,
                },
            });

            if (!token) {
                return failure(new NotFoundError("Token not found."));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(tokenIds: string[]): Promise<TokenArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const tokens = await this.repo
                .createQueryBuilder()
                .where("id IN (:...tokenIds)", { tokenIds })
                .getMany();

            return success(tokens);
        });
    }

    async coingeckoExists(
        coingeckoId: string
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const exists = await this.repo.exist({
                where: {
                    coingeckoId,
                },
            });

            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByEmail(email: string): Promise<TokenResponse> {
        return await Helpers.trySuccessFail(async () => {
            const token = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!token) {
                return failure(new NotFoundError("Token not found."));
            }
            return success(token);
        });
    }

    async update(
        tokenId: string,
        updates: Partial<TokenModel>,
        dbTxn?: EntityManager
    ): Promise<TokenResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: tokenId }, updates)
                : await this.repo.update(tokenId, updates);

            const token = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: tokenId })
                : await this.repo.findOneBy({ id: tokenId });

            if (!token) {
                return failure(new NotFoundError("Token does not exist!"));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async updateByContractAddress(
        contractAddress: string,
        updates: Partial<TokenModel>,
        dbTxn?: EntityManager
    ): Promise<TokenResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { contractAddress }, updates)
                : await this.repo.update({ contractAddress }, updates);

            const token = dbTxn
                ? await dbTxn.findOneBy(this.model, { contractAddress })
                : await this.repo.findOneBy({ contractAddress });

            if (!token) {
                return failure(new NotFoundError("Token does not exist!"));
            }

            return success(token);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(obj: TokenModel): Promise<TokenResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<TokenModel, "client" | "account" | "quote">,
        dbTxn?: EntityManager
    ): Promise<TokenResponse> {
        try {
            const newToken = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newToken);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkCreate(
        rowData: Omit<TokenModel, "client" | "account" | "quote">[]
    ): Promise<FailureOrSuccess<DefaultErrors, InsertResult>> {
        try {
            const response = await this.repo
                .createQueryBuilder()
                .insert()
                .into(TokenModel)
                .values(rowData)
                .onConflict("DO NOTHING")
                .execute();

            return success(response);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
