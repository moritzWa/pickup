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
    BlacklistToken,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type BlacklistTokenResponse = FailureOrSuccess<DefaultErrors, BlacklistToken>;
type BlacklistTokenArrayResponse = FailureOrSuccess<
    DefaultErrors,
    BlacklistToken[]
>;
export type BlacklistTokenParams = Omit<
    BlacklistToken,
    "id" | "createdAt" | "updatedAt"
>;

export class PostgresBlacklistTokenRepository {
    constructor(private model: typeof BlacklistToken) {}

    private get repo(): Repository<BlacklistToken> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<BlacklistToken>
    ): Promise<BlacklistTokenArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findAll(): Promise<BlacklistTokenArrayResponse> {
        try {
            const subscriptions = await this.repo.find();

            return success(subscriptions);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: BlacklistTokenParams,
        dbTxn?: EntityManager
    ): Promise<BlacklistTokenResponse> {
        try {
            if (dbTxn) {
                const obj = await dbTxn.save(this.model, params);
                return success(obj);
            }

            const obj = await this.repo.save(params);

            return success(obj);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
