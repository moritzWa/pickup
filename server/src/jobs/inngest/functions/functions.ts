import { morningReminderCron } from "./scheduled";
import { sendNotification } from "./sendNotification";

export const inngestFunctions = [sendNotification];

export const cronInngestFunctions = [morningReminderCron];
