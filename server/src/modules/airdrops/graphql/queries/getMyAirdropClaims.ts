import {
    list,
    mutationField,
    nonNull,
    nullable,
    objectType,
    queryField,
} from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { analytics } from "src/utils/segment";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { airdropClaimRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { fork } from "radash";
import { AirdropClaimStatus } from "src/core/infra/postgres/entities/Airdrop";

export const GetMyAirdropClaimsResponse = objectType({
    name: "GetMyAirdropClaimsResponse",
    definition: (t) => {
        t.field("pending", {
            type: nonNull(list(nonNull("AirdropClaim"))),
        });
        t.field("claims", {
            type: nonNull(list(nonNull("AirdropClaim"))),
        });
    },
});

export const getMyAirdropClaims = queryField("getMyAirdropClaims", {
    type: nonNull("GetMyAirdropClaimsResponse"),
    resolve: async (_parent, _args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const claimsResponse = await airdropClaimRepo.findForUser(user.id);

        throwIfError(claimsResponse);

        const [pending, all] = fork(
            claimsResponse.value,
            (c) => c.status === AirdropClaimStatus.Pending
        );

        return {
            pending,
            claims: [...pending, ...all],
        };
    },
});
