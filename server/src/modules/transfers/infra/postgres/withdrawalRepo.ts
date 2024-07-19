import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    InsertResult,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { AccountProvider, Withdrawal } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type WithdrawalResponse = FailureOrSuccess<DefaultErrors, Withdrawal>;
type WithdrawalArrayResponse = FailureOrSuccess<DefaultErrors, Withdrawal[]>;

export class PostgresWithdrawalRepository {
    constructor(private model: typeof Withdrawal) {}

    private get repo(): Repository<Withdrawal> {
        return dataSource.getRepository(this.model);
    }

    // findForUser
    public async findForUser(
        userId: string,
        opts: FindManyOptions<Withdrawal>
    ): Promise<WithdrawalArrayResponse> {
        try {
            const withdrawals = await this.repo.find({
                ...opts,
                where: { ...opts?.where, userId },
            });
            return success(withdrawals);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }

    public async findById(
        id: string,
        opts?: FindOneOptions<Withdrawal>
    ): Promise<WithdrawalResponse> {
        try {
            const withdrawal = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id },
            });

            if (!withdrawal) {
                return failure(
                    new NotFoundError(`Withdrawal with id ${id} not found`)
                );
            }

            return success(withdrawal);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }

    public async update(
        id: string,
        params: Partial<Withdrawal>
    ): Promise<WithdrawalResponse> {
        try {
            const result = await this.repo.update(id, params);

            if (result.affected === 0) {
                return failure(
                    new NotFoundError(`Withdrawal with id ${id} not found`)
                );
            }

            return this.findById(id);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }

    public async create(
        params: Omit<Withdrawal, "user">
    ): Promise<WithdrawalResponse> {
        try {
            const withdrawal = await this.repo.save(params);

            return success(withdrawal);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }
}
