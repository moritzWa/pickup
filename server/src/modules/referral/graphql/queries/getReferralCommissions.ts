import { idArg, list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { swapRepo } from "../../../trading/infra/postgres";
import { SwapStatusService } from "../../../trading/services/swapService/swapStatusService";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { referralCommissionRepo } from "../../infra";

export const getReferralCommissions = queryField("getReferralCommissions", {
    type: nonNull(list(nonNull("ReferralCommission"))),
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const commissionResponse = await referralCommissionRepo.find({
            where: { commissionRecipientUserId: user.id },
            take: 100,
            order: { createdAt: "desc" },
        });

        throwIfError(commissionResponse);

        const commissions = commissionResponse.value;

        return commissions;
    },
});
