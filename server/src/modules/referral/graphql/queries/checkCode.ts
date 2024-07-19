import {
    list,
    mutationField,
    nonNull,
    nullable,
    objectType,
    queryField,
    stringArg,
} from "nexus";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { ReferralService } from "../../services/referralService";

export const checkCode = queryField("checkCode", {
    type: nonNull("Boolean"),
    args: {
        referralCode: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const { referralCode } = args;

        const isValidCode = await ReferralService.isValidCode(
            referralCode,
            user.id
        );

        return isValidCode;
    },
});
