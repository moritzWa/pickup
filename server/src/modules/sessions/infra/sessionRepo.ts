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
import { Session as SessionModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type SessionResponse = FailureOrSuccess<DefaultErrors, SessionModel>;
type SessionArrayResponse = FailureOrSuccess<DefaultErrors, SessionModel[]>;

export class PostgresSessionRepository {
    constructor(private model: typeof SessionModel) {}

    private get repo(): Repository<SessionModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<SessionModel>
    ): Promise<SessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findForCourse(
        courseId: string,
        options?: FindManyOptions<SessionModel>
    ): Promise<SessionArrayResponse> {
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
        options?: FindManyOptions<SessionModel>
    ): Promise<SessionArrayResponse> {
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
        options: FindOneOptions<SessionModel>
    ): Promise<SessionResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user) return failure(new NotFoundError("Session not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findBySessionname(username: string): Promise<SessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<SessionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<SessionResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("Session not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<SessionArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<SessionResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("Session not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<SessionModel>,
        dbTxn?: EntityManager
    ): Promise<SessionResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(new NotFoundError("Session does not exist!"));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<SessionModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(SessionModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(new NotFoundError("Session update failed."));
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: SessionModel): Promise<SessionResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<SessionResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(new NotFoundError("Session does not exist!"));
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<SessionModel, "accounts">,
        dbTxn?: EntityManager
    ): Promise<SessionResponse> {
        try {
            const newSession = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newSession);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
