import {
    idArg,
    list,
    mutationField,
    nonNull,
    nullable,
    queryField,
    stringArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { DateTime } from "luxon";
import { ApolloError } from "apollo-server-errors";
import { UserService } from "src/modules/users/services";
import { dateArg } from "src/core/surfaces/graphql/base";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Apollo } from "@sentry/tracing/types/integrations";

export const updateReadFriendsUntil = mutationField("updateReadFriendsUntil", {
    type: nonNull("String"),
    args: {
        userId: nonNull(idArg()),
        newReadFriendsUntil: nonNull(dateArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { userId, newReadFriendsUntil } = args;
        throwIfNotAuthenticated(ctx);
        const me = ctx.me!;

        if (me.id !== userId)
            throw new ApolloError("Unauthorized", "UNAUTHORIZED");

        const newReadFriendsUntilUTC =
            DateTime.fromJSDate(newReadFriendsUntil).toUTC();
        const meReadFriendsUntilUTC = DateTime.fromJSDate(
            me.readFriendsUntil
        ).toUTC();

        if (newReadFriendsUntilUTC > DateTime.utc()) {
            throw new ApolloError(
                "New read friends until must be in the past",
                "INVALID_INPUT"
            );
        }

        if (newReadFriendsUntilUTC < meReadFriendsUntilUTC)
            throw new ApolloError(
                "New read friends until must be greater than current",
                "INVALID_INPUT"
            );

        const updateResp = await UserService.update(userId, {
            readFriendsUntil: newReadFriendsUntilUTC.toJSDate(),
        });
        throwIfError(updateResp);

        return "OK";
    },
});
