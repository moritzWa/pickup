import {
    EntityManager,
    FindManyOptions,
    FindOptionsWhere,
    getRepository,
    LessThanOrEqual,
    MoreThanOrEqual,
    Repository,
} from "typeorm";

import { success, failure, Maybe } from "src/core/logic";
import { UnexpectedError, NotFoundError } from "src/core/logic/errors";
import { DefaultErrors } from "src/core/logic/errors/default";
import { FailureOrSuccess } from "src/core/logic";
import {
    Notification,
    Notification as NotificationModel,
} from "src/core/infra/postgres/entities";
import { dataSource } from "src/core/infra/postgres";
import { Helpers } from "src/utils";

type NotificationResponse = FailureOrSuccess<DefaultErrors, NotificationModel>;
type NotificationArrayResponse = FailureOrSuccess<
    DefaultErrors,
    NotificationModel[]
>;

export class PostgresNotificationRepository {
    constructor(private model: typeof NotificationModel) {}

    private get repo(): Repository<NotificationModel> {
        return dataSource.getRepository(this.model);
    }

    async find(
        options: FindManyOptions<NotificationModel>
    ): Promise<NotificationArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.find(query);
            return success(res);
        });
    }

    async exists(
        notificationId: string
    ): Promise<FailureOrSuccess<DefaultErrors, boolean>> {
        try {
            const exists = await this.repo.exist({
                where: { id: notificationId },
            });

            return success(exists);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async count(
        options: FindManyOptions<NotificationModel>
    ): Promise<FailureOrSuccess<DefaultErrors, number>> {
        return Helpers.trySuccessFail(async () => {
            const query = Helpers.stripUndefined(options);
            const res = await this.repo.count(query);
            return success(res);
        });
    }

    async findById(notificationId: string): Promise<NotificationResponse> {
        try {
            const notification = await this.repo
                .createQueryBuilder()
                .where("id = :notificationId", { notificationId })
                .getOne();

            if (!notification) {
                return failure(new NotFoundError("Notification not found."));
            }

            return success(notification);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async findByIds(
        notificationIds: string[]
    ): Promise<NotificationArrayResponse> {
        return Helpers.trySuccessFail(async () => {
            const notifications = await this.repo
                .createQueryBuilder()
                .where("id IN (:...notificationIds)", { notificationIds })
                .getMany();

            return success(notifications);
        });
    }

    async findByEmail(email: string): Promise<NotificationResponse> {
        return await Helpers.trySuccessFail(async () => {
            const notification = await this.repo
                .createQueryBuilder()
                .where("email = :email", { email })
                .getOne();
            if (!notification) {
                return failure(new NotFoundError("Notification not found."));
            }
            return success(notification);
        });
    }

    async findForUser(
        userId: string,
        opts?: FindManyOptions<Notification>
    ): Promise<NotificationArrayResponse> {
        try {
            const notifications = await this.repo.find({
                ...opts,
                where: { ...opts?.where, userId },
            });

            return success(notifications);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async update(
        notificationId: string,
        updates: Partial<NotificationModel>,
        dbTxn?: EntityManager
    ): Promise<NotificationResponse> {
        try {
            dbTxn
                ? await dbTxn.update(
                      this.model,
                      { id: notificationId },
                      updates
                  )
                : await this.repo.update(notificationId, updates);

            const notification = dbTxn
                ? await dbTxn.findOneBy(this.model, { id: notificationId })
                : await this.repo.findOneBy({ id: notificationId });

            if (!notification) {
                return failure(
                    new NotFoundError("Notification does not exist!")
                );
            }

            return success(notification);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async updateMany(
        where: FindOptionsWhere<Notification>,
        updates: Partial<NotificationModel>
    ): Promise<FailureOrSuccess<DefaultErrors, null>> {
        try {
            await this.repo.update(where, updates);

            return success(null);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async save(obj: NotificationModel): Promise<NotificationResponse> {
        try {
            return success(await this.repo.save(obj));
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    // hard delete
    async delete(notificationId: string): Promise<NotificationResponse> {
        try {
            const notification = await this.repo.findOne({
                where: { id: notificationId },
            });

            if (!notification) {
                return failure(
                    new NotFoundError("Notification does not exist!")
                );
            }

            await this.repo.delete({ id: notificationId });

            return success(notification);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }

    async create(
        params: Omit<NotificationModel, "user" | "followerUser">,
        dbTxn?: EntityManager
    ): Promise<NotificationResponse> {
        try {
            const newNotification = dbTxn
                ? await dbTxn.save(this.model, params)
                : await this.repo.save(params);

            return success(newNotification);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    }
}
