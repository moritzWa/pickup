import { nonNull, nullable, queryField, stringArg } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { airdropClaimRepo, airdropRepo } from "../../infra/postgres";
import { Between, LessThan, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";

export const getAirdropClaimByCode = queryField("getAirdropClaimByCode", {
    type: nonNull("AirdropClaim"),
    args: {
        code: nonNull(stringArg()),
    },
    resolve: async (_parent, args) => {
        const { code } = args;

        const airdropClaimResponse = await airdropClaimRepo.findByCode(code);

        throwIfError(airdropClaimResponse);

        const claim = airdropClaimResponse.value;

        return claim;
    },
});
