import {
    booleanArg,
    intArg,
    mutationField,
    nonNull,
    nullable,
    stringArg,
} from "nexus";
import { v4 as uuidv4 } from "uuid";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { pgUserRepo } from "../../infra/postgres";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { isNil } from "lodash";

export const updateUser = mutationField("updateUser", {
    type: nonNull("User"),
    args: {
        name: nullable(stringArg()),
        hasTwoFactorAuth: nullable(booleanArg()),
        hasMobile: nullable(booleanArg()),
        hasPushNotifications: nullable(booleanArg()),
        biometricPublicKey: nullable(stringArg()),
        unreadCount: nullable(intArg()),
        avatarImageUrl: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const newUserResponse = await pgUserRepo.update(user.id, {
            hasTwoFactorAuth: args?.hasTwoFactorAuth ?? user.hasTwoFactorAuth,
            name: args?.name ?? user.name,
            hasMobile: args?.hasMobile ?? user.hasMobile,
            hasPushNotificationsEnabled:
                args?.hasPushNotifications ?? user.hasPushNotificationsEnabled,
            biometricPublicKey:
                args?.biometricPublicKey ?? user.biometricPublicKey,
            unreadCount: args?.unreadCount ?? user.unreadCount,
            avatarImageUrl: args?.avatarImageUrl ?? user.avatarImageUrl,
        });

        throwIfError(newUserResponse);

        const newUser = newUserResponse.value;

        return newUser;
    },
});
