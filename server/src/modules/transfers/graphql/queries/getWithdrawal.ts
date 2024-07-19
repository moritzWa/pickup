import { idArg, list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { withdrawalRepo } from "../../infra";
import { WithdrawalStatusService } from "../../services/syncWithdrawalService";

export const getWithdrawal = queryField("getWithdrawal", {
    type: nonNull("Withdrawal"),
    args: {
        withdrawalId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { withdrawalId } = args;
        const user = ctx.me!;

        const withdrawalResponse = await withdrawalRepo.findById(
            withdrawalId,
            {}
        );

        throwIfError(withdrawalResponse);

        const withdrawal = withdrawalResponse.value;

        // sync status of swap, and then return it
        const updatedWithdrawalResponse =
            await WithdrawalStatusService.syncStatus(withdrawal);

        throwIfError(updatedWithdrawalResponse);

        const newWithdrawal = updatedWithdrawalResponse.value;

        return newWithdrawal;
    },
});
