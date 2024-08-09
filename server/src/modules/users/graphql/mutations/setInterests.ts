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
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";

export const setInterests = mutationField("setInterests", {
    type: nonNull("User"),
    args: {
        interestDescription: nullable(stringArg()),
        interestCategories: nonNull(list(nonNull(stringArg()))),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const newUserResponse = await pgUserRepo.update(user.id, {
            interestDescription:
                args?.interestDescription ?? user.interestDescription,
            interestCategories:
                args?.interestCategories ?? user.interestCategories,
        });

        throwIfError(newUserResponse);

        const newUser = newUserResponse.value;

        // enqueue building the new queue
        await inngest.send({
            name: InngestEventName.BuildUserQueue,
            data: { userId: user.id },
        });

        return newUser;
    },
});
