import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    Not,
    Repository,
} from "typeorm";
import { sql } from "pg-sql";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { FeedItem as FeedItemModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type FeedItemResponse = FailureOrSuccess<DefaultErrors, FeedItemModel>;
type FeedItemArrayResponse = FailureOrSuccess<DefaultErrors, FeedItemModel[]>;

export class PostgresFeedItemRepository {
    constructor(private model: typeof FeedItemModel) {}

    private get repo(): Repository<FeedItemModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<FeedItemModel>
    ): Promise<FeedItemArrayResponse> {
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
            const feeditems = await this.repo.find({
                where: {
                    userId,
                },
                order: {
                    position: "desc",
                },
                take: 1,
            });

            const position = feeditems[0]?.position || 0;

            return success(position);
        });
    };

    async findOne(
        options: FindOneOptions<FeedItemModel>
    ): Promise<FeedItemResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user) return failure(new NotFoundError("FeedItem not found."));
            return success(user);
        });
    }

    topOfQueue = async (
        userId: string,
        excludingContentId: string | null = null
    ): Promise<FailureOrSuccess<DefaultErrors, Maybe<FeedItemModel>>> => {
        try {
            const items = await this.repo.find({
                where: Helpers.stripUndefined({
                    userId: userId,
                    isQueued: true,
                    contentId: excludingContentId
                        ? Not(excludingContentId)
                        : undefined,
                }),
                order: {
                    queuedAt: "asc",
                },
                take: 1,
            });

            return success(items[0] ?? null);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByFeedItemname(username: string): Promise<FeedItemArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<FeedItemModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<FeedItemResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("FeedItem not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<FeedItemArrayResponse> {
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
        options?: FindManyOptions<FeedItemModel>
    ): Promise<FeedItemArrayResponse> => {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.find({
                ...options,
                where: {
                    ...options?.where,
                    userId,
                },
            });
            return success(res);
        });
    };

    async findByEmail(email: string): Promise<FeedItemResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("FeedItem not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<FeedItemModel>,
        dbTxn?: EntityManager
    ): Promise<FeedItemResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(new NotFoundError("FeedItem does not exist!"));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<FeedItemModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(FeedItemModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(new NotFoundError("FeedItem update failed."));
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: FeedItemModel): Promise<FeedItemResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<FeedItemResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(new NotFoundError("FeedItem does not exist!"));
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<FeedItemModel, "content" | "user">,
        dbTxn?: EntityManager
    ): Promise<FeedItemResponse> {
        try {
            const newFeedItem = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newFeedItem);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
