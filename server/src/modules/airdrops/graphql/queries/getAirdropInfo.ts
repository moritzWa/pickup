import {
    idArg,
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
import { airdropClaimRepo, airdropRepo } from "../../infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import {
    AirdropClaim,
    AirdropClaimStatus,
} from "src/core/infra/postgres/entities/Airdrop";
import { Maybe } from "src/core/logic";

export const GetAirdropInfoResponse = objectType({
    name: "GetAirdropInfoResponse",
    definition: (t) => {
        t.nonNull.boolean("hasClaimedAsInvited");
        t.nonNull.boolean("hasClaimedAsInviter");
        t.nullable.id("invitedAirdropClaimId");
        t.nullable.id("inviterAirdropClaimId");
    },
});

export const getAirdropInfo = queryField("getAirdropInfo", {
    type: nonNull("GetAirdropInfoResponse"),
    args: {
        airdropId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx) => {
        throwIfNotAuthenticated(ctx);

        const { airdropId } = args;

        const me = ctx.me!;
        const airdropResponse = await airdropRepo.findById(airdropId);

        throwIfError(airdropResponse);

        const airdrop = airdropResponse.value;

        const [inviterClaimResponse, invitedClaimResponse] = await Promise.all([
            airdropClaimRepo.findClaimForInviterUserMaybeNull(
                me.id,
                airdrop.id
            ),
            airdropClaimRepo.findClaimForInvitedUserMaybeNull(
                me.id,
                airdrop.id
            ),
        ]);

        throwIfError(inviterClaimResponse);
        throwIfError(invitedClaimResponse);

        const inviterClaim = inviterClaimResponse.value;
        const invitedClaim = invitedClaimResponse.value;

        const hasClaimedAsInvited = _hasClaimed(me.id, invitedClaim);
        const hasClaimedAsInviter = _hasClaimed(me.id, inviterClaim);
        const invitedAirdropClaimId = invitedClaim?.id ?? null;
        const inviterAirdropClaimId = inviterClaim?.id ?? null;

        return {
            hasClaimedAsInvited,
            hasClaimedAsInviter,
            invitedAirdropClaimId,
            inviterAirdropClaimId,
        };
    },
});

const _hasClaimed = (userId: string, a: Maybe<AirdropClaim>) =>
    !!a &&
    (a.status === AirdropClaimStatus.Claimed ||
        a.status === AirdropClaimStatus.Succeeded) &&
    (a.invitedUserId === userId || a.inviterUserId === userId);
