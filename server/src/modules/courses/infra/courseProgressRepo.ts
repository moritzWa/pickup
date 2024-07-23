import {
    EntityManager,
    FindManyOptions,
    FindOneOptions,
    getRepository,
    In,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import { CourseProgress as CourseProgressModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type CourseProgressResponse = FailureOrSuccess<
    DefaultErrors,
    CourseProgressModel
>;
type CourseProgressArrayResponse = FailureOrSuccess<
    DefaultErrors,
    CourseProgressModel[]
>;

export class PostgresCourseProgressRepository {
    constructor(private model: typeof CourseProgressModel) {}

    private get repo(): Repository<CourseProgressModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<CourseProgressModel>
    ): Promise<CourseProgressArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    findForUserAndCourses = async (
        userId: string,
        courseIds: string[],
        opts: FindManyOptions<CourseProgressModel>
    ): Promise<CourseProgressArrayResponse> => {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo.find({
                ...opts,
                where: { ...opts?.where, userId, courseId: In(courseIds) },
            });

            return success(users);
        });
    };

    async findOne(
        options: FindOneOptions<CourseProgressModel>
    ): Promise<CourseProgressResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user)
                return failure(new NotFoundError("CourseProgress not found."));
            return success(user);
        });
    }

    findForCourseAndUser = async (
        courseId: string,
        userId: string,
        opts?: FindManyOptions<CourseProgressModel>
    ): Promise<CourseProgressResponse> => {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne({
                ...opts,
                where: { ...opts?.where, courseId, userId },
            });

            if (!user) {
                return failure(new NotFoundError("CourseProgress not found."));
            }

            return success(user);
        });
    };

    async count(
        options: FindManyOptions<CourseProgressModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<CourseProgressResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("CourseProgress not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<CourseProgressArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<CourseProgressResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("CourseProgress not found."));
            }
            return success(user);
        });
    }

    updateProgressOfCourse = async (
        userId: string,
        courseId: string,
        updates: Partial<CourseProgressModel>,
        dbTxn?: EntityManager
    ): Promise<CourseProgressResponse> => {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { userId, courseId }, updates)
                : await this.repo.update({ userId, courseId }, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { userId, courseId })
                : await this.repo.findOneBy({ userId, courseId });

            if (!user) {
                return failure(
                    new NotFoundError("CourseProgress does not exist!")
                );
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    async update(
        userId: string,
        updates: Partial<CourseProgressModel>,
        dbTxn?: EntityManager
    ): Promise<CourseProgressResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(
                    new NotFoundError("CourseProgress does not exist!")
                );
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<CourseProgressModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(CourseProgressModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(
                    new NotFoundError("CourseProgress update failed.")
                );
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: CourseProgressModel): Promise<CourseProgressResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<CourseProgressResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(
                    new NotFoundError("CourseProgress does not exist!")
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
            CourseProgressModel,
            "course" | "user" | "mostRecentLesson"
        >,
        dbTxn?: EntityManager
    ): Promise<CourseProgressResponse> {
        try {
            const newCourseProgress = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newCourseProgress);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
