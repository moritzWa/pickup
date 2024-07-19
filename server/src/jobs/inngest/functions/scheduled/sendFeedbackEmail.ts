import { Datadog, coingecko, logHistogram } from "src/utils";
import { Slack, SlackChannel } from "src/utils";
import { cronsInngest, inngest } from "../../clients";
import { slugify } from "inngest";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { LessThan } from "typeorm";
import moment = require("moment");
import { swapRepo } from "src/modules/trading/infra/postgres";
import { UserNotificationService } from "src/modules/users/services/userNotificationService";
import { connect } from "src/core/infra/postgres";

// every day at 10am EST
const CRON = "0 14 * * *";
const DAYS_AGO = 3;
const NAME = "Send Feedback Email";

const sendFeedbackEmail = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
    },
    { cron: CRON },
    async () => await runCron()
);

const runCron = async () => {
    // console.log("[building current coingecko price cache]");

    const start = Date.now();
    const date = moment.utc().subtract({ days: DAYS_AGO });

    const usersResponse = await pgUserRepo.find({
        where: {
            // created at was at least 3 days ago
            createdAt: LessThan(date.toDate()),
            hasEmailedFeedback: false,
        },
    });

    if (usersResponse.isFailure()) {
        throw usersResponse.error;
    }

    const users = usersResponse.value;
    const promises: Promise<any>[] = [];
    for (const user of users) {
        promises.push(_sendToUser(user));
    }

    await Promise.all(promises);

    const end = Date.now();

    logHistogram({
        metric: "feedback_emails.duration",
        value: end - start,
        logIfOver: 30_000,
    });

    console.log(`Successfully send feedback emails.`);
};

const _sendToUser = async (user: any) => {
    const hasSwappedResponse = await swapRepo.userHasSwapped(user.id);

    if (hasSwappedResponse.isFailure()) {
        throw hasSwappedResponse.error;
    }

    const hasSwapped = hasSwappedResponse.value;

    // if (hasSwapped) {
    //     const response =
    //         await UserNotificationService.sendFeedbackToTraderEmail(user);
    //     if (response.isFailure()) {
    //         return; // will recover and email them later
    //     }
    // } else {
    //     const response =
    //         await UserNotificationService.sendFeedbackToNonTraderEmail(user);
    //     if (response.isFailure()) {
    //         return; // will recover and email them later
    //     }
    // }

    const response = await pgUserRepo.update(user.id, {
        hasEmailedFeedback: true,
    });

    if (response.isFailure()) {
        return;
    }

    // void Slack.send({
    //     channel: SlackChannel.Traders,
    //     format: true,
    //     message: `Sent feedback email to user ${user.id} (${
    //         user.email
    //     })\n\nStatus: ${hasSwapped ? "Has Traded ✅" : "Has NOT Traded 🎣"}`,
    // });

    return;
};

export { sendFeedbackEmail };

// // if we are calling this file call the above function
if (require.main === module) {
    connect()
        .then(() => runCron())
        .catch(console.error)
        .finally(() => process.exit(1));
}
