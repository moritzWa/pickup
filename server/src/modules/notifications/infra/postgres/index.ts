import { Notification } from "src/core/infra/postgres/entities";
import { PostgresNotificationRepository } from "./notificationRepo";

export const notificationRepo = new PostgresNotificationRepository(
    Notification
);
