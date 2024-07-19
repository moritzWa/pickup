import { idArg, list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { SwapStatusService } from "../../../trading/services/swapService/swapStatusService";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { referralCommissionRepo, referralRepo } from "../../infra";

export const GetReferralEarningsResponse = objectType({
    name: "GetReferralEarningsResponse",
    definition(t) {
        t.nonNull.float("totalEarningsCents");
        t.nonNull.float("totalReferrals");
    },
});

export const getReferralsInfo = queryField("getReferralsInfo", {
    type: nonNull("GetReferralEarningsResponse"),
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const referralsResponse =
            await referralRepo.findReferralsWhereUserReferredCount(user.id);

        throwIfError(referralsResponse);

        const earningsResponse = await referralCommissionRepo.totalEarnings(
            user.id
        );

        throwIfError(earningsResponse);

        const earnings = earningsResponse.value;
        const referrals = referralsResponse.value;

        return {
            totalEarningsCents: earnings.toNumber(),
            totalReferrals: referrals,
        };
    },
});
