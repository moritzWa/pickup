import { buildUserQueue } from "./buildUserQueue";
import { morningReminderCron } from "./scheduled";
import { buildDailyQueueCron } from "./scheduled/buildDailyQueueCron";
import { sendNotification } from "./sendNotification";

export const inngestFunctions = [sendNotification, buildUserQueue];

export const cronInngestFunctions = [morningReminderCron, buildDailyQueueCron];
