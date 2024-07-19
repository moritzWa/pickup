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
import { SwapEvent as SwapEventModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";
import moment = require("moment");

type SwapEventResponse = FailureOrSuccess<DefaultErrors, SwapEventModel>;
type SwapEventArrayResponse = FailureOrSuccess<DefaultErrors, SwapEventModel[]>;

export class PostgresSwapEventRepository {
    constructor(private model: typeof SwapEventModel) {}

    private get repo(): Repository<SwapEventModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<SwapEventModel>
    ): Promise<SwapEventArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async count(
        options: FindManyOptions<SwapEventModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        swapeventId: string,
        opts?: FindManyOptions<SwapEventModel>
    ): Promise<SwapEventResponse> {
        try {
            const swapevent = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    id: swapeventId,
                },
            });

            if (!swapevent) {
                return failure(new NotFoundError("SwapEvent not found."));
            }

            return success(swapevent);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async userHasSwapEventped(
        userId: string,
        opts?: FindManyOptions<SwapEventModel>
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

    async findByIds(swapeventIds: string[]): Promise<SwapEventArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const swapevents = await this.repo
                .createQueryBuilder()
                .where("id IN (:...swapeventIds)", { swapeventIds })
                .getMany();

            return success(swapevents);
        });
    }

    async findByEmail(email: string): Promise<SwapEventResponse> {
        return await Helpers.trySuccessFail(async () => {
            const swapevent = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!swapevent) {
                return failure(new NotFoundError("SwapEvent not found."));
            }
            return success(swapevent);
        });
    }

    async update(
        swapeventId: string,
        updates: Partial<SwapEventModel>,
        dbTxn?: EntityManager
    ): Promise<SwapEventResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: swapeventId }, updates)
                : await this.repo.update(swapeventId, updates);

            const swapevent = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: swapeventId })
                : await this.repo.findOneBy({ id: swapeventId });

            if (!swapevent) {
                return failure(new NotFoundError("SwapEvent does not exist!"));
            }

            return success(swapevent);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(obj: SwapEventModel): Promise<SwapEventResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<SwapEventModel, "client" | "account" | "quote" | "user">,
        dbTxn?: EntityManager
    ): Promise<SwapEventResponse> {
        try {
            const newSwapEvent = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newSwapEvent);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
