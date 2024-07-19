import {
    idArg,
    list,
    nonNull,
    nullable,
    objectType,
    queryField,
    stringArg,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { swapRepo } from "../../infra/postgres";
import { SwapStatusService } from "../../services/swapService/swapStatusService";
import { SwapStatus } from "src/core/infra/postgres/entities/Trading";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { In, Not } from "typeorm";

export const IsFirstSwapTokenResponse = objectType({
    name: "IsFirstSwapTokenResponse",
    definition(t) {
        t.nonNull.boolean("isFirstSwap");
        t.nonNull.float("totalSwaps");
    },
});

export const getIsFirstSwapForToken = queryField("getIsFirstSwapForToken", {
    type: nonNull("IsFirstSwapTokenResponse"),
    args: {
        contractAddress: nonNull(stringArg()),
        provider: nonNull("AccountProviderEnum"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;
        const { provider: _provider, contractAddress } = args;

        const swapResponse = await swapRepo.count({
            where: {
                userId: me.id,
                status: Not(SwapStatus.Failed),
                chain: ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_provider],
                receiveTokenContractAddress: contractAddress,
            },
        });

        throwIfError(swapResponse);

        const swaps = swapResponse.value;

        return {
            isFirstSwap: swaps === 1,
            totalSwaps: swaps,
        };
    },
});
