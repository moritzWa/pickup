export default null;

// import { Datadog, coingecko, logHistogram, trackError } from "src/utils";
// import { Slack, SlackChannel } from "src/utils";
// import { Tags } from "hot-shots";
// import { cronsInngest, inngest } from "../../clients";
// import { slugify } from "inngest";
// import { pgUserRepo } from "src/modules/users/infra/postgres";
// import { LessThan } from "typeorm";
// import moment = require("moment");
// import { swapRepo } from "src/modules/trading/infra/postgres";
// import { connect } from "src/core/infra/postgres";
// import { Sentry } from "src/utils/sentry";
// import {
//     DefaultErrors,
//     FailureOrSuccess,
//     failure,
//     success,
// } from "src/core/logic";
// import { NotificationService } from "src/modules/notifications/services/notificationService";
// import { throwIfError } from "src/core/surfaces/graphql/common";
// import { UserService } from "src/modules/users/services";

// // every 1 minute
// const CRON = "*/1 * * * *";
// const NAME = "Send User Notifications";

// const sendUserNotifications = inngest.createFunction(
//     {
//         name: NAME,
//         id: slugify(NAME),
//     },
//     { cron: CRON },
//     async () => await runCron()
// );

// const runCron = async () => {
//     const start = Date.now();
//     console.log("running send notifications cron");
//     const response = await _sendNotifications();

//     if (response.isFailure()) {
//         _recordErr();
//         Sentry.captureException(response.error);
//         throw response.error;
//     }

//     _recordOk();

//     const end = Date.now();

//     logHistogram({
//         metric: "send_user_notifications.duration",
//         value: end - start,
//         logIfOver: 10_000,
//     });

//     return Promise.resolve();
// };

// const _sendNotifications = async (): Promise<
//     FailureOrSuccess<DefaultErrors, number>
// > => {
//     console.log("🔔 running _sendNotifications");
//     // get all notifications that need to be sent
//     const unsentNotifsResp = await NotificationService.find({
//         where: {
//             hasSent: false,
//         },
//     });
//     if (unsentNotifsResp.isFailure()) return failure(unsentNotifsResp.error);
//     const unsentNotifs = unsentNotifsResp.value;
//     console.log("unsent notifications: ", unsentNotifs.length);

//     // send them!
//     for (const notification of unsentNotifs) {
//         // get user
//         const userResp = await UserService.findById(notification.userId);
//         if (userResp.isFailure()) return failure(userResp.error);
//         const user = userResp.value;

//         // let this fail silently for now otherwise the whole claim can get kinda botched
//         // just if SMS or push fails, really these should just be retried
//         await NotificationService.sendPushOrSMSNotification(user, notification);

//         // update user
//         const updateResponse = await pgUserRepo.update(user.id, {
//             unreadCount: user.unreadCount + 1,
//         });
//         // if (updateResponse.isFailure()) return failure(updateResponse.error); // don't fail if it fails -- don't want send twice

//         // update notification sent status
//         const updateNotifResp = await NotificationService.update(
//             notification.id,
//             {
//                 hasSent: true,
//             }
//         );
//         if (updateNotifResp.isFailure()) return failure(updateNotifResp.error);
//     }

//     console.log("sent notifications: ", unsentNotifs.length);

//     return success(unsentNotifs.length);
// };

// export { sendUserNotifications, _sendNotifications };

// const _recordOk = (tags?: Tags) =>
//     Datadog.increment("notification_worker.ok", 1, tags);

// const _recordErr = trackError("notification_worker.err", 1);

// // // if we are calling this file call the above function
// if (require.main === module) {
//     connect()
//         .then(() => runCron())
//         .catch(console.error)
//         .finally(() => process.exit(1));
// }
