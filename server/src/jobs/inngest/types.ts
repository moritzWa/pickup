import { Maybe } from "src/core/logic";
import { NotificationData } from "./functions/types";

export enum InngestEventName {
    SendNotification = "notifications/send",
}

export type CronInngestEvents = {};

export type InngestEvents = {
    [InngestEventName.SendNotification]: {
        data: NotificationData;
    };
};
