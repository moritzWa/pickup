import { buildUserQueue } from "./buildUserQueue";
import { processContent } from "./processContent";
import { morningReminderCron } from "./scheduled";
import { buildDailyQueueCron } from "./scheduled/buildDailyQueueCron";
import { syncRSSFeedCron } from "./scheduled/syncRssFeedsCron";
import { sendNotification } from "./sendNotification";

export const inngestFunctions = [
    sendNotification,
    buildUserQueue,
    // processContent,
];

export const cronInngestFunctions = [
    morningReminderCron,
    buildDailyQueueCron,
    syncRSSFeedCron,
];
