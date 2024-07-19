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
import { referralRepo } from "../../infra";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const getReferrals = queryField("getReferrals", {
    type: nonNull(list(nonNull("Referral"))),
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const referralsResponse =
            await referralRepo.findReferralsWhereUserReferred(user.id);

        throwIfError(referralsResponse);

        const referrals = referralsResponse.value;

        return referrals;
    },
});
