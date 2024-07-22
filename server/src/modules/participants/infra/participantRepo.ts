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
import { Participant as ParticipantModel } from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type ParticipantResponse = FailureOrSuccess<DefaultErrors, ParticipantModel>;
type ParticipantArrayResponse = FailureOrSuccess<
    DefaultErrors,
    ParticipantModel[]
>;

export class PostgresParticipantRepository {
    constructor(private model: typeof ParticipantModel) {}

    private get repo(): Repository<ParticipantModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<ParticipantModel>
    ): Promise<ParticipantArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async findOne(
        options: FindOneOptions<ParticipantModel>
    ): Promise<ParticipantResponse> {
        return Helpers.trySuccessFail(async () => {
            const user = await this.repo.findOne(options);
            if (!user)
                return failure(new NotFoundError("Participant not found."));
            return success(user);
        });
    }

    async findForUser(
        userId: string,
        options?: FindManyOptions<ParticipantModel>
    ): Promise<ParticipantArrayResponse> {
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

    // YOU MUST CHECK BY LOWERCASE IF YOU SEARCH BY USERNAME!
    async findByParticipantname(
        username: string
    ): Promise<ParticipantArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("LOWER(username) = LOWER(:username)", { username })
                .getMany();

            return success(users);
        });
    }

    async count(
        options: FindManyOptions<ParticipantModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(userId: string): Promise<ParticipantResponse> {
        try {
            const user = await this.repo
                .createQueryBuilder()
                .where("id = :userId", { userId })
                .getOne();

            if (!user) {
                return failure(new NotFoundError("Participant not found."));
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(userIds: string[]): Promise<ParticipantArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const users = await this.repo
                .createQueryBuilder()
                .where("id IN (:...userIds)", { userIds })
                .getMany();

            return success(users);
        });
    }

    async findByEmail(email: string): Promise<ParticipantResponse> {
        return await Helpers.trySuccessFail(async () => {
            const user = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!user) {
                return failure(new NotFoundError("Participant not found."));
            }
            return success(user);
        });
    }

    async update(
        userId: string,
        updates: Partial<ParticipantModel>,
        dbTxn?: EntityManager
    ): Promise<ParticipantResponse> {
        try {
            dbTxn
                ? await dbTxn.update(this.model, { id: userId }, updates)
                : await this.repo.update(userId, updates);

            const user = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: userId })
                : await this.repo.findOneBy({ id: userId });

            if (!user) {
                return failure(
                    new NotFoundError("Participant does not exist!")
                );
            }

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async bulkUpdate(
        userIds: string[],
        updates: Partial<ParticipantModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            if (!userIds.length) {
                return success(0);
            }

            const updateResult = await this.repo
                .createQueryBuilder()
                .update(ParticipantModel)
                .set(updates)
                .where("id IN (:...userIds)", { userIds })
                .execute();

            if (!updateResult) {
                return failure(new NotFoundError("Participant update failed."));
            }

            return success(updateResult.affected || 0);
        });
    }

    async save(obj: ParticipantModel): Promise<ParticipantResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(userId: string): Promise<ParticipantResponse> {
        try {
            const user = await this.repo.findOne({
                where: { id: userId },
            });

            if (!user) {
                return failure(
                    new NotFoundError("Participant does not exist!")
                );
            }

            await this.repo.delete({ id: userId });

            return success(user);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<ParticipantModel, "user" | "course" | "character">,
        dbTxn?: EntityManager
    ): Promise<ParticipantResponse> {
        try {
            const newParticipant = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newParticipant);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
