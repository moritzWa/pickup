import {
    idArg,
    list,
    mutationField,
    nonNull,
    nullable,
    queryField,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { notificationRepo } from "../../infra";
import { In } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";

export const readNotifications = mutationField("readNotifications", {
    type: nonNull("String"),
    args: {
        notificationIds: nonNull(list(nonNull(idArg()))),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const { notificationIds } = args;

        console.log(`[marking ${notificationIds.length} as read]`);

        const notificationsResponse = await notificationRepo.findForUser(
            user.id,
            {
                where: { id: In(notificationIds) },
                select: { id: true },
            }
        );

        throwIfError(notificationsResponse);

        const ids = notificationsResponse.value.map((n) => n.id);

        if (ids.length === 0) {
            throw new ApolloError("No notifications found.");
        }

        const readResponse = await notificationRepo.updateMany(
            {
                id: In(ids),
                userId: user.id,
                hasRead: false,
            },
            {
                hasRead: true,
            }
        );

        throwIfError(readResponse);

        return "Updated notifications.";
    },
});
