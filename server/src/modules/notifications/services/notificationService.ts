import { Notification, User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { onesignal } from "src/utils/onesignal";
import { twilio } from "src/utils/twilio";
import { notificationRepo } from "../infra";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { v4 as uuidv4 } from "uuid";
import { EntityManager, FindManyOptions } from "typeorm";
import { UserService } from "src/modules/users/services";
import {
    NotificationChannel,
    OnesignalJobData,
} from "src/jobs/inngest/functions/types";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { Datadog } from "src/utils";
import { NotificationType } from "src/core/infra/postgres/entities/Notification";

const find = async (options: FindManyOptions<Notification>) =>
    notificationRepo.find(options);

const update = (
    userId: string,
    params: Partial<Notification>,
    dbTxn?: EntityManager
) => notificationRepo.update(userId, params, dbTxn);

// tries to do push notification, then falls back to phone number
const sendPushOrSMSNotification = async (
    user: User,
    notification: Notification
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    if (user.hasPushNotificationsEnabled) {
        const response = await onesignal.notifications.send(user, {
            title: notification.title,
            message: notification.subtitle,
        });

        // if success, return early. otherwise try the other methods
        if (response.isSuccess()) {
            return success(null);
        }

        console.log("=== one signal error ===");
        console.log(response.error);
    }

    return success(null);
};

/**
 * @deprecated need to fix but don't want to test so just making a new one that uses our send notification inngest
 *
 * @param user
 * @param params
 * @returns
 */
export const sendNotification = async (
    user: User,
    params: {
        title: string;
        subtitle: string;
        iconImageUrl: string | null;
        // for follower notifications
        followerUserId: string | null;
        feedInsertionId: string | null;
        type: NotificationType;
    },
    shouldSend: boolean
): Promise<FailureOrSuccess<DefaultErrors, Notification>> => {
    // create the notification
    const notificationResponse = await notificationRepo.create({
        iconImageUrl: params.iconImageUrl ?? null,
        title: params.title,
        subtitle: params.subtitle,
        followerUserId: params.followerUserId,
        type: params.type,
        feedInsertionId: params.feedInsertionId,
        idempotency: uuidv4(),
        userId: user.id,
        hasSent: true,
        id: uuidv4(),
        hasRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    if (notificationResponse.isFailure()) {
        return failure(notificationResponse.error);
    }

    const notification = notificationResponse.value;

    if (shouldSend) {
        // let this fail silently for now otherwise the whole claim can get kinda botched
        // just if SMS or push fails, really these should just be retried
        await sendPushOrSMSNotification(user, notification);
    }

    // if (sendResponse.isFailure()) {
    //     // delete the notification in this case
    //     await notificationRepo.delete(notification.id);

    //     return failure(sendResponse.error);
    // }

    // update user
    const updateResponse = await pgUserRepo.update(user.id, {
        unreadCount: user.unreadCount + 1,
    });

    if (updateResponse.isFailure()) return failure(updateResponse.error);

    // update notification sent status
    const updateNotifResp = await notificationRepo.update(notification.id, {
        hasSent: true,
    });
    if (updateNotifResp.isFailure()) {
        return failure(updateNotifResp.error);
    }

    return success(notification);
};

// Create a notification. This will be picked up by the cron and sent out asynchronously
export const create = async (params: {
    userId: string;
    title: string;
    subtitle: string;
    iconImageUrl: string | null;
    followerUserId: string | null;
    feedInsertionId: string | null;
    type: NotificationType;
}): Promise<FailureOrSuccess<DefaultErrors, Notification>> => {
    // create the notification
    const notificationResponse = await notificationRepo.create({
        iconImageUrl: params.iconImageUrl ?? null,
        title: params.title,
        followerUserId: params.followerUserId,
        feedInsertionId: params.feedInsertionId,
        subtitle: params.subtitle,
        userId: params.userId,
        id: uuidv4(),
        hasRead: false,
        hasSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        idempotency: uuidv4(),
        type: params.type,
    });
    if (notificationResponse.isFailure())
        return failure(notificationResponse.error);
    const notification = notificationResponse.value;
    return success(notification);
};

export type SendNotificationParams = {
    idempotency: string; // to make sure not sent multiple times
    title: string;
    subtitle: string;
    type: NotificationType;
    iconImageUrl: string | null;
    // for follower notifications
    followerUserId: string | null;
    feedInsertionId: string | null;
};

export const createAndSend = async (
    user: Pick<User, "id" | "hasPushNotificationsEnabled">,
    params: SendNotificationParams
): Promise<FailureOrSuccess<DefaultErrors, Notification>> => {
    // create the notification
    try {
        const notificationResponse = await notificationRepo.create({
            iconImageUrl: params.iconImageUrl ?? null,
            idempotency: params.idempotency,
            title: params.title,
            subtitle: params.subtitle,
            followerUserId: params.followerUserId,
            feedInsertionId: params.feedInsertionId,
            type: params.type,
            userId: user.id,
            hasSent: false,
            id: uuidv4(),
            hasRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        if (notificationResponse.isFailure()) {
            console.error(notificationResponse.error);

            Datadog.increment("notification.create_and_send.err");

            return failure(notificationResponse.error);
        }

        const notification = notificationResponse.value;

        // if (user.hasPushNotificationsEnabled) {
        const data: OnesignalJobData = {
            userId: user.id,
            title: notification.title,
            message: notification.subtitle,
            channel: NotificationChannel.Onesignal,
        };

        console.log(`[sending push to ${user.id}]`);

        await inngest.send({
            id: params.idempotency,
            name: InngestEventName.SendNotification,
            data,
        });
        // } else {
        //     console.log(`[not sending push to ${user.id}]`);
        // }

        Datadog.increment("notification.create_and_send.ok");

        // update user
        // const updateResponse = await pgUserRepo.update(user.id, {
        //     unreadCount: user.unreadCount + 1,
        // });

        // if (updateResponse.isFailure()) {
        //     return failure(updateResponse.error);
        // }

        // update notification sent status
        const updateNotifResp = await notificationRepo.update(notification.id, {
            hasSent: true,
        });

        if (updateNotifResp.isFailure()) {
            return failure(updateNotifResp.error);
        }

        return success(notification);
    } catch (err) {
        Datadog.increment("notification.create_and_send.err");

        return failure(new UnexpectedError(err));
    }
};

export const NotificationService = {
    find,
    update,
    create,
    sendNotification,
    sendPushOrSMSNotification,
    createAndSend,
};
