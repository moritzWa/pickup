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
import { Swap as SwapModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import moment = require("moment");

type SwapResponse = FailureOrSuccess<DefaultErrors, SwapModel>;
type SwapArrayResponse = FailureOrSuccess<DefaultErrors, SwapModel[]>;

export class PostgresSwapRepository {
    constructor(private model: typeof SwapModel) {}

    private get repo(): Repository<SwapModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<SwapModel>
    ): Promise<SwapArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async count(
        options: FindManyOptions<SwapModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        swapId: string,
        opts?: FindManyOptions<SwapModel>
    ): Promise<SwapResponse> {
        try {
            const swap = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    id: swapId,
                },
            });

            if (!swap) {
                return failure(new NotFoundError("Swap not found."));
            }

            return success(swap);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async userHasSwapped(
        userId: string,
        opts?: FindManyOptions<SwapModel>
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const exists = await this.repo.exist({
                ...opts,
                where: {
                    ...opts?.where,
                    userId,
                },
            });

            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async isPendingForToken(
        userId: string,
        tokenAddress: string
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const where: FindOptionsWhere<SwapModel>[] = [
                {
                    status: In([SwapStatus.Confirmed, SwapStatus.Pending]),
                    userId,
                    sendTokenContractAddress: tokenAddress,
                    // and createdAt is less than an hour ago
                    createdAt: MoreThan(moment().subtract(1, "hour").toDate()),
                },
                {
                    status: In([SwapStatus.Confirmed, SwapStatus.Pending]),
                    userId,
                    receiveTokenContractAddress: tokenAddress,
                    // and createdAt is less than an hour ago
                    createdAt: MoreThan(moment().subtract(1, "hour").toDate()),
                },
            ];

            const exists = await this.repo.exist({
                where: where,
            });

            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async hasPending(
        userId: string
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const where: FindOptionsWhere<SwapModel>[] = [
                {
                    status: In([SwapStatus.Confirmed, SwapStatus.Pending]),
                    userId,
                    createdAt: MoreThan(
                        moment().subtract(15, "minutes").toDate()
                    ),
                },
            ];

            const exists = await this.repo.exist({
                where: where,
            });

            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(swapIds: string[]): Promise<SwapArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const swaps = await this.repo
                .createQueryBuilder()
                .where("id IN (:...swapIds)", { swapIds })
                .getMany();

            return success(swaps);
        });
    }

    async findByEmail(email: string): Promise<SwapResponse> {
        return await Helpers.trySuccessFail(async () => {
            const swap = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!swap) {
                return failure(new NotFoundError("Swap not found."));
            }
            return success(swap);
        });
    }

    async update(
        swapId: string,
        updates: Partial<SwapModel>,
        dbTxn?: EntityManager
    ): Promise<SwapResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: swapId }, updates)
                : await this.repo.update(swapId, updates);

            const swap = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: swapId })
                : await this.repo.findOneBy({ id: swapId });

            if (!swap) {
                return failure(new NotFoundError("Swap does not exist!"));
            }

            return success(swap);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async updateMany(
        where: FindOptionsWhere<SwapModel>,
        updates: Partial<SwapModel>,
        dbTxn?: EntityManager
    ): Promise<FailureOrSuccess<DefaultErrors, void>> {
        return Helpers.trySuccessFail(async () => {
            return dbTxn
                ? await dbTxn.update(this.model, where, updates)
                : await this.repo.update(where, updates);
        });
    }

    async save(obj: SwapModel): Promise<SwapResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<SwapModel, "client" | "account" | "quote" | "user">,
        dbTxn?: EntityManager
    ): Promise<SwapResponse> {
        try {
            const newSwap = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newSwap);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
