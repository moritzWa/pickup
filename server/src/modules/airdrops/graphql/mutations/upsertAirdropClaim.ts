import { idArg, mutationField, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { airdropClaimRepo, airdropRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";
import { AirdropClaimService } from "../../services/airdropClaimService";

export const upsertAirdropClaim = mutationField("upsertAirdropClaim", {
    type: nonNull("AirdropClaim"),
    args: {
        airdropId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const { airdropId } = args;

        const airdropResponse = await airdropRepo.findById(airdropId);

        throwIfError(airdropResponse);

        const airdrop = airdropResponse.value;

        const existingAirdropClaimResponse =
            await airdropClaimRepo.findIfUserIsInviterForAirdrop(
                user.id,
                airdropId
            );

        throwIfError(existingAirdropClaimResponse);

        const existingAirdropClaim = existingAirdropClaimResponse.value;

        if (existingAirdropClaim) {
            return existingAirdropClaim;
        }

        const airdropClaimResponse = await AirdropClaimService.create(
            airdrop,
            user
        );

        throwIfError(airdropClaimResponse);

        const airdropClaim = airdropClaimResponse.value;

        return airdropClaim;
    },
});
