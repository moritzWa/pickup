import {
    booleanArg,
    intArg,
    list,
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

export const setCommuteTime = mutationField("setCommuteTime", {
    type: nonNull("User"),
    args: {
        timezone: nullable(stringArg()),
        commuteTime: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const newUserResponse = await pgUserRepo.update(user.id, {
            timezone: args?.timezone ?? user.timezone,
            commuteTime: args?.commuteTime ?? user.commuteTime,
        });

        throwIfError(newUserResponse);

        const newUser = newUserResponse.value;

        return newUser;
    },
});
