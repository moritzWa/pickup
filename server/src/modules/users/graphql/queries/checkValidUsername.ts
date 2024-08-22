import { list, mutationField, nonNull, queryField, stringArg } from "nexus";
import { ProfileService } from "../../services/profileService";

export const checkValidUsername = queryField("checkValidUsername", {
    type: nonNull("String"),
    args: {
        username: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        const { username: _username } = args;
        const username = ProfileService.sanitizeUsername(_username);
        const user = ctx.me;

        // check username
        const isValidResp = await ProfileService.checkValidUsername(
            username,
            user
        );
        if (isValidResp.isFailure()) {
            throw new Error(isValidResp.error.message);
        }

        return "OK";
    },
});
