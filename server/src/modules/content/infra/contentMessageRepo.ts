import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { ContentMessage as ContentMessageModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type ContentMessageResponse = FailureOrSuccess<
    DefaultErrors,
    ContentMessageModel
>;
type ContentMessageArrayResponse = FailureOrSuccess<
    DefaultErrors,
    ContentMessageModel[]
>;

export class PostgresContentMessageRepository {
    constructor(private model: typeof ContentMessageModel) {}

    private get repo(): Repository<ContentMessageModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<ContentMessageModel>
    ): Promise<ContentMessageArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findForUser(
        userId: string,
        options?: FindManyOptions<ContentMessageModel>
    ): Promise<ContentMessageArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.find({
                ...options,
                where: {
                    ...options?.where,
                    userId: userId,
                },
            });

            return success(res);
        });
    }

    async findForContentAndUser(
        { contentId, userId }: { contentId: string; userId: string },
        options?: FindManyOptions<ContentMessageModel>
    ): Promise<ContentMessageArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.find({
                ...options,
                where: {
                    ...options?.where,
                    contentId,
                    userId,
                },
            });

            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<ContentMessageModel>
    ): Promise<ContentMessageResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user)
                return failure(new NotFoundError("ContentMessage not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByContentMessagename(
        username: string
    ): Promise<ContentMessageArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<ContentMessageModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<ContentMessageResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("ContentMessage not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<ContentMessageArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<ContentMessageResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("ContentMessage not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<ContentMessageModel>,
        dbTxn?: EntityManager
    ): Promise<ContentMessageResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(
                    new NotFoundError("ContentMessage does not exist!")
                );
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<ContentMessageModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(ContentMessageModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(
                    new NotFoundError("ContentMessage update failed.")
                );
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: ContentMessageModel): Promise<ContentMessageResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<ContentMessageResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(
                    new NotFoundError("ContentMessage does not exist!")
                );
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<
            ContentMessageModel,
            "content" | "user" | "contentSession"
        >,
        dbTxn?: EntityManager
    ): Promise<ContentMessageResponse> {
        try {
            const newContentMessage = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newContentMessage);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
