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
import { Course as CourseModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type CourseResponse = FailureOrSuccess<DefaultErrors, CourseModel>;
type CourseArrayResponse = FailureOrSuccess<DefaultErrors, CourseModel[]>;

export class PostgresCourseRepository {
    constructor(private model: typeof CourseModel) {}

    private get repo(): Repository<CourseModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<CourseModel>
    ): Promise<CourseArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<CourseModel>
    ): Promise<CourseResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user) return failure(new NotFoundError("Course not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByCoursename(username: string): Promise<CourseArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<CourseModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<CourseResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("Course not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<CourseArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<CourseResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("Course not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<CourseModel>,
        dbTxn?: EntityManager
    ): Promise<CourseResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(new NotFoundError("Course does not exist!"));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<CourseModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(CourseModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(new NotFoundError("Course update failed."));
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: CourseModel): Promise<CourseResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<CourseResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(new NotFoundError("Course does not exist!"));
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<CourseModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<CourseResponse> {
        try {
            const newCourse = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newCourse);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
