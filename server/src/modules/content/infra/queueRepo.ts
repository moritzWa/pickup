import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    Repository,
} from "typeorm";
import { sql } from "pg-sql";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { Queue as QueueModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type QueueResponse = FailureOrSuccess<DefaultErrors, QueueModel>;
type QueueArrayResponse = FailureOrSuccess<DefaultErrors, QueueModel[]>;

export class PostgresQueueRepository {
    constructor(private model: typeof QueueModel) {}

    private get repo(): Repository<QueueModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<QueueModel>
    ): Promise<QueueArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    currentPosition = async (
        userId: string
    ): Promise<FailureOrSuccess<DefaultErrors, number>> => {
        return Helpers.trySuccessFail(async () => {
            const queues = await this.repo.find({
                where: {
                    userId,
                },
                order: {
                    position: "desc",
                },
                take: 1,
            });

            const position = queues[0]?.position || 0;

            return success(position);
        });
    };

    async findOne(options: FindOneOptions<QueueModel>): Promise<QueueResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user) return failure(new NotFoundError("Queue not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByQueuename(username: string): Promise<QueueArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<QueueModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<QueueResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("Queue not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<QueueArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    findForUser = async (
        userId: string,
        options?: FindManyOptions<QueueModel>
    ): Promise<QueueArrayResponse> => {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find({
                ...query,
                where: {
                    userId,
                },
            });
            return success(res);
        });
    };

    async findByEmail(email: string): Promise<QueueResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("Queue not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<QueueModel>,
        dbTxn?: EntityManager
    ): Promise<QueueResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(new NotFoundError("Queue does not exist!"));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<QueueModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(QueueModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(new NotFoundError("Queue update failed."));
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: QueueModel): Promise<QueueResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<QueueResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(new NotFoundError("Queue does not exist!"));
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<QueueModel, "content" | "user">,
        dbTxn?: EntityManager
    ): Promise<QueueResponse> {
        try {
            const newQueue = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newQueue);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
