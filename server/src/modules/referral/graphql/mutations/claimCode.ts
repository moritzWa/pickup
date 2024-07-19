import {
    idArg,
    list,
    mutationField,
    nonNull,
    objectType,
    stringArg,
} from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { D } from "src/utils";
import { ReferralService } from "../../services";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";
import { ApolloError } from "apollo-server-errors";
import { pgRelationshipRepo } from "src/modules/profile/infra";

export const ClaimCodeResponse = objectType({
    name: "ClaimCodeResponse",
    definition(t) {
        t.nonNull.string("message");
    },
});

export const claimCode = mutationField("claimCode", {
    type: nonNull("ClaimCodeResponse"),
    args: {
        referralCode: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        const { referralCode } = args;

        if (!user.hasVerifiedPhoneNumber) {
            throw new ApolloError(
                "Please verify your phone number to claim a referral code.",
                "400"
            );
        }

        const referralResponse =
            await ReferralService.attemptToApplyReferralCode(
                user,
                referralCode || null
            );

        throwIfError(referralResponse);

        const referral = referralResponse.value;

        if (!referral) {
            throw new ApolloError("Referral is invalid.", "400");
        }

        // also make this user follow the person that is referred, and get notified when they buy
        const createResp = await pgRelationshipRepo.create({
            fromUserId: referral.referredUserId,
            toUserId: referral.referredByUserId,
            notifyOnBuy: true,
        });

        // await inngest.send({
        //     name: InngestEventName.ClaimReferralBonus,
        //     data: { referralId: referral.id },
        // });

        return {
            message: `Successfully used referral code!`,
        };
    },
});
