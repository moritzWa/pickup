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
import { LessonProgress as LessonProgressModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type LessonProgressResponse = FailureOrSuccess<
    DefaultErrors,
    LessonProgressModel
>;
type LessonProgressArrayResponse = FailureOrSuccess<
    DefaultErrors,
    LessonProgressModel[]
>;

export class PostgresLessonProgressRepository {
    constructor(private model: typeof LessonProgressModel) {}

    private get repo(): Repository<LessonProgressModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<LessonProgressModel>
    ): Promise<LessonProgressArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findForCourse(
        courseId: string,
        options?: FindManyOptions<LessonProgressModel>
    ): Promise<LessonProgressArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.find({
                ...options,
                where: {
                    ...options?.where,
                    courseId,
                },
            });

            return success(res);
        });
    }

    async findForLessonAndUser(
        params: {
            lessonId: string;
            userId: string;
        },
        options?: FindManyOptions<LessonProgressModel>
    ): Promise<LessonProgressResponse> {
        return Helpers.trySuccessFail(async () => {
            const res = await this.repo.findOne({
                ...options,
                where: {
                    ...options?.where,
                    lessonId: params.lessonId,
                    userId: params.userId,
                },
            });

            return success(res);
        });
    }

    async findForUser(
        userId: string,
        options?: FindManyOptions<LessonProgressModel>
    ): Promise<LessonProgressArrayResponse> {
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

    async findOne(
        options: FindOneOptions<LessonProgressModel>
    ): Promise<LessonProgressResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user)
                return failure(new NotFoundError("LessonProgress not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByLessonProgressname(
        username: string
    ): Promise<LessonProgressArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<LessonProgressModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<LessonProgressResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("LessonProgress not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<LessonProgressArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<LessonProgressResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("LessonProgress not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<LessonProgressModel>,
        dbTxn?: EntityManager
    ): Promise<LessonProgressResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(
                    new NotFoundError("LessonProgress does not exist!")
                );
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<LessonProgressModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(LessonProgressModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(
                    new NotFoundError("LessonProgress update failed.")
                );
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: LessonProgressModel): Promise<LessonProgressResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<LessonProgressResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(
                    new NotFoundError("LessonProgress does not exist!")
                );
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<LessonProgressModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<LessonProgressResponse> {
        try {
            const newLessonProgress = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newLessonProgress);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
