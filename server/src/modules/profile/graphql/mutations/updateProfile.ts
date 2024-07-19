import {
    mutationField,
    nullable,
    objectType,
    nonNull,
    stringArg,
    idArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { UserService } from "src/modules/users/services";
import { ProfileService } from "../../services";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Maybe } from "src/core/logic";

export const updateProfile = mutationField("updateProfile", {
    type: nonNull("String"),
    args: {
        username: nullable(stringArg()),
        name: nullable(stringArg()),
        description: nullable(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { username: _username, name, description } = args;
        throwIfNotAuthenticated(ctx);
        const user = ctx.me!;

        // check username
        let username: Maybe<string> = null;
        if (_username) {
            username = ProfileService.sanitizeUsername(_username);
            const isValidResp = await ProfileService.checkValidUsername(
                username,
                user
            );
            if (isValidResp.isFailure()) {
                throw new Error(isValidResp.error.message);
            }
        }

        // update profile
        const updateResp = await UserService.update(user.id, {
            // only update fields if non null
            username: username ?? undefined,
            name: name ?? undefined,
            description: description ?? undefined,
        });
        throwIfError(updateResp);

        // resysnc username if it changed
        if (username) {
            const resyncUsernameResp = await UserService.update(user.id, {
                usernameSynced: false,
            });
            throwIfError(resyncUsernameResp);
        }

        return "OK";
    },
});
