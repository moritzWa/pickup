import {
    EntityManager,
    FindManyOptions,
    InsertResult,
    Repository,
} from "typeorm";

import { success, failure, Maybe, UnexpectedError } from "src/core/logic";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    AccountProvider,
    FavoriteMemecoin,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import { pgUserRepo } from "src/modules/users/infra/postgres";

type FavoriteMemecoinParams = Omit<
    FavoriteMemecoin,
    "createdAt" | "updatedAt" | "id" | "user"
>;
type FavoriteMemecoinResponse = FailureOrSuccess<
    DefaultErrors,
    FavoriteMemecoin
>;
type FavoriteMemecoinArrayResponse = FailureOrSuccess<
    DefaultErrors,
    FavoriteMemecoin[]
>;

export class PostgresFavoriteMemecoinRepository {
    constructor(private model: typeof FavoriteMemecoin) {}

    private get repo(): Repository<FavoriteMemecoin> {
        return dataSource.getRepository(this.model);
    }

    async create(
        params: FavoriteMemecoinParams
    ): Promise<FavoriteMemecoinResponse> {
        try {
            const coin = await this.repo.save(params);
            return success(coin);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findForUser(userId: string): Promise<FavoriteMemecoinArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const coins = await this.repo.find({
                where: {
                    userId,
                },
            });
            return success(coins);
        });
    }

    async findForContractAddressAndProvider(
        userId: string,
        contractAddress: string,
        provider: AccountProvider
    ): Promise<FailureOrSuccess<DefaultErrors, Maybe<FavoriteMemecoin>>> {
        return Helpers.trySuccessFail(async () => {
            const coins = await this.repo.findOne({
                where: {
                    userId,
                    contractAddress,
                    provider,
                },
            });
            return success(coins);
        });
    }

    async delete(
        memecoinId: string
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const result = await this.repo.delete(memecoinId);
            return success(result.affected || 0);
        });
    }
}
