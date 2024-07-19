import { idArg, list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { swapRepo } from "../../infra/postgres";
import { SwapStatusService } from "../../services/swapService/swapStatusService";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";

export const getSwap = queryField("getSwap", {
    type: nonNull("Swap"),
    args: {
        swapId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { swapId } = args;
        const user = ctx.me!;

        const swapResponse = await swapRepo.findById(swapId, {});

        throwIfError(swapResponse);

        const swap = swapResponse.value;

        // if it isn't pending, just return the swap

        // sync status of swap, and then return it
        const updatedSwapResponse = await SwapStatusService.syncStatus(swap);

        throwIfError(updatedSwapResponse);

        const updatedSwap = updatedSwapResponse.value;

        return updatedSwap;
    },
});
