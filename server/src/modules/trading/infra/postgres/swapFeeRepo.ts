import {
    EntityManager,
    FindManyOptions,
    FindOptionsWhere,
    getRepository,
    In,
    MoreThan,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { SwapFee as SwapFeeModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import moment = require("moment");

type SwapFeeResponse = FailureOrSuccess<DefaultErrors, SwapFeeModel>;
type SwapFeeArrayResponse = FailureOrSuccess<DefaultErrors, SwapFeeModel[]>;

export class PostgresSwapFeeRepository {
    constructor(private model: typeof SwapFeeModel) {}

    private get repo(): Repository<SwapFeeModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<SwapFeeModel>
    ): Promise<SwapFeeArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async count(
        options: FindManyOptions<SwapFeeModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        swapfeeId: string,
        opts?: FindManyOptions<SwapFeeModel>
    ): Promise<SwapFeeResponse> {
        try {
            const swapfee = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    id: swapfeeId,
                },
            });

            if (!swapfee) {
                return failure(new NotFoundError("SwapFee not found."));
            }

            return success(swapfee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(swapfeeIds: string[]): Promise<SwapFeeArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const swapfees = await this.repo
                .createQueryBuilder()
                .where("id IN (:...swapfeeIds)", { swapfeeIds })
                .getMany();

            return success(swapfees);
        });
    }

    async findByEmail(email: string): Promise<SwapFeeResponse> {
        return await Helpers.trySuccessFail(async () => {
            const swapfee = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!swapfee) {
                return failure(new NotFoundError("SwapFee not found."));
            }
            return success(swapfee);
        });
    }

    async update(
        swapfeeId: string,
        updates: Partial<SwapFeeModel>,
        dbTxn?: EntityManager
    ): Promise<SwapFeeResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: swapfeeId }, updates)
                : await this.repo.update(swapfeeId, updates);

            const swapfee = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: swapfeeId })
                : await this.repo.findOneBy({ id: swapfeeId });

            if (!swapfee) {
                return failure(new NotFoundError("SwapFee does not exist!"));
            }

            return success(swapfee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async updateMany(
        where: FindOptionsWhere<SwapFeeModel>,
        updates: Partial<SwapFeeModel>,
        dbTxn?: EntityManager
    ): Promise<FailureOrSuccess<DefaultErrors, void>> {
        return Helpers.trySuccessFail(async () => {
            return dbTxn
                ? await dbTxn.update(this.model, where, updates)
                : await this.repo.update(where, updates);
        });
    }

    async save(obj: SwapFeeModel): Promise<SwapFeeResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async deleteForSwap(
        swapId: string
    ): Promise<FailureOrSuccess<DefaultErrors, null>> {
        return await Helpers.trySuccessFail(async () => {
            await this.repo.delete({ swapId });

            return success(null);
        });
    }

    async create(
        params: Omit<
            SwapFeeModel,
            "client" | "account" | "quote" | "user" | "swap"
        >,
        dbTxn?: EntityManager
    ): Promise<SwapFeeResponse> {
        try {
            const newSwapFee = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newSwapFee);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
