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
import { ContentSession as ContentSessionModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type ContentSessionResponse = FailureOrSuccess<
    DefaultErrors,
    ContentSessionModel
>;
type ContentSessionArrayResponse = FailureOrSuccess<
    DefaultErrors,
    ContentSessionModel[]
>;

export class PostgresContentSessionRepository {
    constructor(private model: typeof ContentSessionModel) {}

    private get repo(): Repository<ContentSessionModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<ContentSessionModel>
    ): Promise<ContentSessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findForUser(
        userId: string,
        options?: FindManyOptions<ContentSessionModel>
    ): Promise<ContentSessionArrayResponse> {
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
    }

    async findForContentAndUser(
        { contentId, userId }: { contentId: string; userId: string },
        options?: FindManyOptions<ContentSessionModel>
    ): Promise<ContentSessionResponse> {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.findOne({
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

    findBookmarks = async (
        userId: string,
        options?: FindManyOptions<ContentSessionModel>
    ): Promise<ContentSessionArrayResponse> => {
        try {
            const res = await this.repo.find({
                ...options,
                where: {
                    ...options?.where,
                    userId,
                    isBookmarked: true,
                },
            });

            return success(res);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    findLikes = async (
        userId: string,
        options?: FindManyOptions<ContentSessionModel>
    ): Promise<ContentSessionArrayResponse> => {
        try {
            const res = await this.repo.find({
                ...options,
                where: {
                    ...options?.where,
                    userId,
                    isLiked: true,
                },
            });

            return success(res);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    async findOne(
        options: FindOneOptions<ContentSessionModel>
    ): Promise<ContentSessionResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user)
                return failure(new NotFoundError("ContentSession not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByContentSessionname(
        username: string
    ): Promise<ContentSessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<ContentSessionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(
        sessionId: string,
        opts?: FindOneOptions<ContentSessionModel>
    ): Promise<ContentSessionResponse> {
        try {
            const session = await this.repo.findOne({
                ...opts,
                where: {
                    ...opts?.where,
                    id: sessionId,
                },
            });

            if (!session) {
                return failure(new NotFoundError("Session not found."));
            }

            return success(session);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<ContentSessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<ContentSessionResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("ContentSession not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<ContentSessionModel>,
        dbTxn?: EntityManager
    ): Promise<ContentSessionResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(
                    new NotFoundError("ContentSession does not exist!")
                );
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<ContentSessionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(ContentSessionModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(
                    new NotFoundError("ContentSession update failed.")
                );
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: ContentSessionModel): Promise<ContentSessionResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<ContentSessionResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(
                    new NotFoundError("ContentSession does not exist!")
                );
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<ContentSessionModel, "content" | "user">,
        dbTxn?: EntityManager
    ): Promise<ContentSessionResponse> {
        try {
            const newContentSession = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newContentSession);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
