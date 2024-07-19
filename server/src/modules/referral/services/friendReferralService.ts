import { dataSource } from "src/core/infra/postgres";
import { User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    NotFoundError,
    success,
    UnexpectedError,
} from "src/core/logic";
import { UserService } from "src/modules/users/services";
import { AnalyticsService, EventName } from "src/shared/analyticsService";
import { EntityManager, In } from "typeorm";
import { referralRepo } from "../infra";
import { v4 as uuidv4 } from "uuid";
import { getNewCreditAmount } from "./utils";
import {
    FRIEND_REFERRED_BY_DEFAULT_CREDIT_CENTS,
    FRIEND_REFERRED_DEFAULT_CREDIT_CENTS,
} from "./constants";
import { Slack, SlackChannel } from "src/utils";
import {
    DEFAULT_REFERRAL_AMOUNT_USDC,
    DEFAULT_REFERRAL_USDC_ICON_IMAGE_URL,
    DEFAULT_REFERRAL_USDC_MINT,
    DEFAULT_REFERRAL_USDC_SYMBOL,
    Referral,
} from "src/core/infra/postgres/entities/Referrals/Referral";

const attemptToApplyFriendReferralCodeAndEarnCredit = async (
    userBeingReferred: User,
    referralCode: Maybe<string>
): Promise<FailureOrSuccess<DefaultErrors, Referral | null>> => {
    if (!referralCode || !userBeingReferred) {
        return success(null);
    }

    if (
        referralCode.toLowerCase() ===
        userBeingReferred.referralCode?.toLowerCase()
    ) {
        return failure(new Error("Can't use your own referral code!"));
    }

    const userResponse = await UserService.findForReferralCode(referralCode);

    if (userResponse.isFailure() || !userResponse.value) {
        return failure(new NotFoundError("Invalid referral code!"));
    }

    const referredByUser = userResponse.value;

    const referralExistsResponse = await referralRepo.findOne({
        where: {
            referredUserId: userBeingReferred.id,
            referredByUserId: referredByUser.id,
        },
    });

    if (referralExistsResponse.isFailure()) {
        return failure(referralExistsResponse.error);
    }

    if (referralExistsResponse.value) {
        return failure(new Error("You already used this referral code!"));
    }

    // if (!referredByUser.isAffiliate) {
    //     return failure(
    //         new Error("Only codes from Movement affiliates are valid.")
    //     );
    // }

    const userHasBeenReferredResponse = await referralRepo.hasBeenReferred(
        userBeingReferred.id
    );

    if (userHasBeenReferredResponse.isFailure()) {
        return failure(userHasBeenReferredResponse.error);
    }

    const hasBeenReferred = userHasBeenReferredResponse.value;

    if (hasBeenReferred) {
        return failure(new Error("You have already been referred!"));
    }

    const friendReferralResponse = await createFriendReferral(
        userBeingReferred,
        referredByUser
    );

    if (friendReferralResponse.isFailure()) {
        return failure(friendReferralResponse.error);
    }

    void AnalyticsService.track({
        userId: userBeingReferred.id,
        eventName: EventName.ReferralClaimed,
        properties: { type: "friend", code: referralCode },
    });

    return friendReferralResponse;
};

const isValidFriendReferralCode = async (
    referralCode: string
): Promise<boolean> => {
    const userResponse = await UserService.findForReferralCode(referralCode);
    if (userResponse.isFailure()) return false;
    const referredByUser = userResponse.value;
    if (!referredByUser) return false;
    return true;
};

const createFriendReferral = async (
    userBeingReferred: User,
    referredByUser: User
): Promise<FailureOrSuccess<DefaultErrors, Referral>> => {
    try {
        let referral: Referral | null = null;

        await dataSource.transaction(async (dbTxn) => {
            await _updateMetadataOnPersonBeingReferred(
                userBeingReferred,
                referredByUser,
                dbTxn
            );

            // create the referrals
            const referralResponse = await referralRepo.create(
                {
                    referredByUserId: referredByUser.id,
                    referredUserId: userBeingReferred.id,
                    hasClaimedReward: false,
                    rewardClaimedAt: null,
                    rewardTokenSymbol: DEFAULT_REFERRAL_USDC_SYMBOL,
                    rewardTransactionHash: null,
                    isDepositSuccessful: false,
                    rewardAmount:
                        referredByUser.referralRewardAmount ??
                        DEFAULT_REFERRAL_AMOUNT_USDC,
                    rewardTokenContractAddress: DEFAULT_REFERRAL_USDC_MINT,
                    rewardTokenIconImageUrl:
                        DEFAULT_REFERRAL_USDC_ICON_IMAGE_URL,
                    id: uuidv4(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                dbTxn
            );

            void Slack.send({
                channel: SlackChannel.Referrals,
                message: [
                    `User referred (not paid) 🥳\n`,
                    `Referred: ${userBeingReferred.name} (${userBeingReferred.email})`,
                    `Referred By: ${referredByUser.name} (${referredByUser.email})`,
                ].join("\n"),
                format: true,
            });

            if (referralResponse.isFailure()) {
                throw referralResponse.error;
            }

            referral = referralResponse.value;
        });

        if (!referral) {
            return failure(new Error("Referral not created"));
        }

        return success(referral);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _updateMetadataOnPersonBeingReferred = async (
    userBeingReferred: User,
    referredByUser: User,
    dbTxn: EntityManager
) => {
    // if the user doesn't have a referred by code set -> update it so we noted how the user was referred to us
    if (!userBeingReferred.referredByCode) {
        const userResponse = await UserService.update(
            userBeingReferred.id,
            {
                referredByCode: referredByUser.referralCode,
                referredByName: referredByUser?.name || null,
            },
            dbTxn
        );

        if (userResponse.isFailure()) {
            throw userResponse.error;
        }
    }

    const clientResponse = await UserService.update(
        userBeingReferred.id,
        {
            referredByCode: referredByUser.referralCode,
            referredByName: referredByUser.name || null,
        },
        dbTxn
    );

    if (clientResponse.isFailure()) {
        throw clientResponse.error;
    }
};

export const FriendReferralService = {
    attemptToApplyFriendReferralCodeAndEarnCredit,
    isValidFriendReferralCode,
};
