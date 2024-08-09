import { Maybe } from "src/core/logic";
import { BuildUserQueueData, NotificationData } from "./functions/types";

export enum InngestEventName {
    SendNotification = "notifications/send",
    BuildUserQueue = "user-queue/build",
}

export type CronInngestEvents = {};

export type InngestEvents = {
    [InngestEventName.SendNotification]: {
        data: NotificationData;
    };
    [InngestEventName.BuildUserQueue]: {
        data: BuildUserQueueData;
    };
};
