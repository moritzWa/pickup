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
import { LessonSession as LessonSessionModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type LessonSessionResponse = FailureOrSuccess<
    DefaultErrors,
    LessonSessionModel
>;
type LessonSessionArrayResponse = FailureOrSuccess<
    DefaultErrors,
    LessonSessionModel[]
>;

export class PostgresLessonSessionRepository {
    constructor(private model: typeof LessonSessionModel) {}

    private get repo(): Repository<LessonSessionModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<LessonSessionModel>
    ): Promise<LessonSessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findForCourse(
        courseId: string,
        options?: FindManyOptions<LessonSessionModel>
    ): Promise<LessonSessionArrayResponse> {
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

    async findForUser(
        userId: string,
        options?: FindManyOptions<LessonSessionModel>
    ): Promise<LessonSessionArrayResponse> {
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
        options: FindOneOptions<LessonSessionModel>
    ): Promise<LessonSessionResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user)
                return failure(new NotFoundError("LessonSession not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByLessonSessionname(
        username: string
    ): Promise<LessonSessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<LessonSessionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<LessonSessionResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("LessonSession not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<LessonSessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<LessonSessionResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("LessonSession not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<LessonSessionModel>,
        dbTxn?: EntityManager
    ): Promise<LessonSessionResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(
                    new NotFoundError("LessonSession does not exist!")
                );
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<LessonSessionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(LessonSessionModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(
                    new NotFoundError("LessonSession update failed.")
                );
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: LessonSessionModel): Promise<LessonSessionResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<LessonSessionResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(
                    new NotFoundError("LessonSession does not exist!")
                );
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<LessonSessionModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<LessonSessionResponse> {
        try {
            const newLessonSession = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newLessonSession);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
