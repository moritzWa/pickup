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
import { AccountProvider, Deposit } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type DepositResponse = FailureOrSuccess<DefaultErrors, Deposit>;
type DepositArrayResponse = FailureOrSuccess<DefaultErrors, Deposit[]>;

export class PostgresDepositRepository {
    constructor(private model: typeof Deposit) {}

    private get repo(): Repository<Deposit> {
        return dataSource.getRepository(this.model);
    }

    // findForUser
    public async findForUser(
        userId: string,
        opts: FindManyOptions<Deposit>
    ): Promise<DepositArrayResponse> {
        try {
            const deposits = await this.repo.find({
                ...opts,
                where: { ...opts?.where, userId },
            });
            return success(deposits);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }

    public async findById(
        id: string,
        opts?: FindOneOptions<Deposit>
    ): Promise<DepositResponse> {
        try {
            const deposit = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, id },
            });

            if (!deposit) {
                return failure(
                    new NotFoundError(`Deposit with id ${id} not found`)
                );
            }

            return success(deposit);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }

    public async update(
        id: string,
        params: Partial<Deposit>
    ): Promise<DepositResponse> {
        try {
            const result = await this.repo.update(id, params);

            if (result.affected === 0) {
                return failure(
                    new NotFoundError(`Deposit with id ${id} not found`)
                );
            }

            return this.findById(id);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }

    public async create(
        params: Omit<Deposit, "user">
    ): Promise<DepositResponse> {
        try {
            const deposit = await this.repo.save(params);

            return success(deposit);
        } catch (error) {
            return failure(new UnexpectedError(error));
        }
    }
}
