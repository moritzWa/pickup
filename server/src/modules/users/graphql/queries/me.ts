import { nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";

export const me = queryField("me", {
    type: nullable("User"),
    resolve: async (_parent, _args, ctx: Context) => {
        // console.log(ctx);

        if (ctx.me) {
            const user = ctx.me!;
            // analytics.identify({
            //     userId: user.id,
            //     traits: {
            //         name: user.name,
            //         email: user.email,
            //         id: user.id,
            //         createdAt: user.createdAt,
            //         hasMobile: user.hasMobile,
            //         hasPushNotificationsEnabled:
            //             user.hasPushNotificationsEnabled,
            //         isReferred: !isNil(user.referredByCode),
            //     },
            // });
        }

        const user = ctx.me;

        if (!user) {
            return null;
        }

        console.log(user);

        return user;
    },
});
