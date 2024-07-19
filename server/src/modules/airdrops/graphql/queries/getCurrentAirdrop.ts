import { nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { airdropClaimRepo, airdropRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ApolloError } from "apollo-server-errors";
import { isNil } from "lodash";
import { AirdropClaimService } from "../../services/airdropClaimService";

export const getCurrentAirdrop = queryField("getCurrentAirdrop", {
    type: nullable("Airdrop"),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const me = ctx.me!;
        const currentAirdropResponse = await airdropRepo.findCurrent();

        throwIfError(currentAirdropResponse);

        const airdrop = currentAirdropResponse.value;

        if (!airdrop) {
            throw new ApolloError("No airdrop is currently active.", "404");
        }

        const hasClaimed = await AirdropClaimService.getHasClaimed(me, airdrop);

        return {
            ...currentAirdropResponse.value,
            hasClaimed,
        };
    },
});
