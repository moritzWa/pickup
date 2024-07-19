import { idArg, mutationField, nonNull, nullable, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { analytics } from "src/utils/segment";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { airdropClaimRepo } from "../../infra/postgres";
import { ApolloError } from "apollo-server-errors";
import { AirdropClaimStatus } from "src/core/infra/postgres/entities/Airdrop";
import { inngest, sendToInngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { AirdropClaimService } from "../../services/airdropClaimService";

export const claimAirdrop = mutationField("claimAirdrop", {
    type: nonNull("AirdropClaim"),
    args: {
        airdropClaimId: nonNull(idArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { airdropClaimId } = args;
        const user = ctx.me!;

        const airdropClaimResponse = await airdropClaimRepo.findById(
            airdropClaimId,
            {
                relations: { inviter: true },
            }
        );

        throwIfError(airdropClaimResponse);

        const claim = airdropClaimResponse.value;

        // user has to have verified phone number
        if (!user.hasVerifiedPhoneNumber || !user.phoneNumber) {
            throw new ApolloError(
                "You must verify your phone number to claim airdrops.",
                "400"
            );
        }

        if (!claim.inviter?.hasVerifiedPhoneNumber) {
            throw new ApolloError(
                "The person who shared this airdrop with you needs to verify their phone number before you can claim it.",
                "400"
            );
        }

        if (claim.status === AirdropClaimStatus.Claimed) {
            throw new ApolloError("Airdrop is marked as claimed.", "400");
        }

        // if a txn -> just assume okay. eventually can get the status on it or something
        if (claim.status === AirdropClaimStatus.Succeeded) {
            throw new ApolloError("Airdrop already successfully paid.", "400");
        }

        // allow super users to bypass this check (for testing)
        if (claim.inviterUserId === user.id && !user.isSuperuser) {
            throw new ApolloError("You cannot claim your own airdrop.", "400");
        }

        // look to see if you have an airdrop claim with this person already (no circular claims)

        const existsResponse =
            await airdropClaimRepo.findClaimForInviterUserMaybeNull(
                user.id,
                claim.airdropId
            );

        throwIfError(existsResponse);

        const existingClaim = existsResponse.value;

        // if there is an existing claim where this user claiming already was the inviter,
        // make sure the claim isn't just the inverse
        if (existingClaim) {
            const alreadyHasClaimWithTheseUsers =
                existingClaim.inviterUserId === user.id &&
                existingClaim.invitedUserId === claim.inviterUserId;

            if (alreadyHasClaimWithTheseUsers && !user.isSuperuser) {
                throw new ApolloError(
                    "You already have an airdrop claimed with this friend.",
                    "400"
                );
            }
        }

        // make sure we have enough to actually pay them for claiming
        const canClaimResponse = await AirdropClaimService.canClaim(claim);

        throwIfError(canClaimResponse);

        // update the claim with this user's ID
        const claimUpdateResponse = await airdropClaimRepo.update(claim.id, {
            invitedUserId: user.id,
            status: AirdropClaimStatus.Claimed,
        });

        throwIfError(claimUpdateResponse);

        await sendToInngest(
            async () =>
                await inngest.send({
                    name: InngestEventName.ClaimAirdrop,
                    data: {
                        airdropClaimId: claim.id,
                        userId: user.id,
                    },
                })
        );

        return claimUpdateResponse.value;
    },
});
