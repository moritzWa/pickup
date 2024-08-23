import { list, nonNull, nullable, queryField, stringArg } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { notificationRepo } from "../../infra";
import { throwIfError } from "src/core/surfaces/graphql/common";

const DEFAULT_LIMIT = 100;

export const getNotifications = queryField("getNotifications", {
    type: nonNull(list(nonNull("Notification"))),
    resolve: async (_parent, args, ctx) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;

        const notificationResponse = await notificationRepo.findForUser(me.id, {
            take: DEFAULT_LIMIT,
            skip: 0,
            order: { createdAt: "desc" },
        });

        throwIfError(notificationResponse);

        const notifications = notificationResponse.value;

        return notifications;
    },
});
