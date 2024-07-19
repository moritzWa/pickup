import { list, nonNull, nullable, queryField, stringArg } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { notificationRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const getNumUnreadNotifications = queryField(
    "getNumUnreadNotifications",
    {
        type: nonNull("Int"),
        resolve: async (_parent, args, ctx) => {
            throwIfNotAuthenticated(ctx);

            const me = ctx.me!;

            const numNotifsResp = await notificationRepo.count({
                where: {
                    userId: me.id,
                    hasRead: false,
                },
            });
            throwIfError(numNotifsResp);
            const numNotifs = numNotifsResp.value;

            return numNotifs as any;
        },
    }
);
