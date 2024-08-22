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
import { User as UserModel } from "src/core/infra/postgres/entities";
import { UserAuthProvider } from "src/core/infra/postgres/entities/User";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type UserResponse = FailureOrSuccess<DefaultErrors, UserModel>;
type UserArrayResponse = FailureOrSuccess<DefaultErrors, UserModel[]>;

export class PostgresUserRepository {
    constructor(private model: typeof UserModel) {}

    private get repo(): Repository<UserModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<UserModel>
    ): Promise<UserArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(options: FindOneOptions<UserModel>): Promise<UserResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user) return failure(new NotFoundError("User not found."));
            return success(user);
        });
    }

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByUsername(username: string): Promise<UserResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getOne();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<UserModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<UserResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("User not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(
        userIds: string[],
        opts?: FindManyOptions<UserModel>
    ): Promise<UserArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo.find({
                ...opts,
                where: {
                    ...opts?.where,
                    id: In(userIds),
                },
            });

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<UserResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("User not found."));
            }
            return success(user);
        });
    }

    async findByFirebaseUid(firebaseUid: string): Promise<UserResponse> {
        try {
            const user = await this.repo.findOne({
                where: {
                    authProvider: UserAuthProvider.Firebase,
                    authProviderId: firebaseUid,
                },
            });

            if (!user) {
                return failure(new NotFoundError("User not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByReferralCode(referralCode: string): Promise<UserResponse> {
        try {
            const user = await this.repo.findOne({
                where: {
                    referralCode,
                },
            });

            if (!user) {
                return failure(new NotFoundError("User not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        userId: string,
        updates: Partial<UserModel>,
        dbTxn?: EntityManager
    ): Promise<UserResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(new NotFoundError("User does not exist!"));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<UserModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(UserModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(new NotFoundError("User update failed."));
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: UserModel): Promise<UserResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<UserResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(new NotFoundError("User does not exist!"));
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<UserModel, "accounts" | "currentContentSession">,
        dbTxn?: EntityManager
    ): Promise<UserResponse> {
        try {
            const newUser = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newUser);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
