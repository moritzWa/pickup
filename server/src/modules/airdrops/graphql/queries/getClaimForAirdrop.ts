import { idArg, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { airdropClaimRepo, airdropRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";

export const getClaimForAirdrop = queryField("getClaimForAirdrop", {
    type: nonNull("AirdropClaim"),
    args: {
        airdropId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;
        const { airdropId } = args;

        const airdropResponse = await airdropRepo.findById(airdropId);

        throwIfError(airdropResponse);

        const airdrop = airdropResponse.value;

        const claimResponse =
            await airdropClaimRepo.findForInviterUserAndAirdrop(
                me.id,
                airdrop.id,
                {
                    relations: {
                        airdrop: true,
                    },
                }
            );

        throwIfError(claimResponse);

        const claim = claimResponse.value;

        return claim;
    },
});
