import { idArg, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { airdropClaimRepo, airdropRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";
import { AirdropClaimService } from "../../services/airdropClaimService";

export const getAirdropClaimById = queryField("getAirdropClaimById", {
    type: nonNull("AirdropClaim"),
    args: {
        airdropClaimId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;
        const { airdropClaimId } = args;

        const airdropClaimResponse = await airdropClaimRepo.findById(
            airdropClaimId,
            { relations: { airdrop: true, inviter: true, invited: true } }
        );

        throwIfError(airdropClaimResponse);

        const claim = airdropClaimResponse.value;

        const isUserIn: boolean =
            claim.invitedUserId === me.id || claim.inviterUserId === me.id;

        const userEarnAmount = AirdropClaimService.getEarnAmount(me.id, claim);

        return {
            ...claim,
            isUserIn,
            userEarnAmount: userEarnAmount.toNumber(),
            invitedUsername: claim.invited?.username,
            inviterUsername: claim.inviter?.username,
        };
    },
});
