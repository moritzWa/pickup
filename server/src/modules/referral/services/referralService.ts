import { nanoid } from "nanoid";
import { Referral, User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    NotFoundError,
    success,
} from "src/core/logic";
import { FindManyOptions } from "typeorm";
import { referralRepo } from "../infra";
import { FriendReferralService } from "./friendReferralService";
import { SpecialCodeService } from "./specialCodesService";

const getReferralCode = () => nanoid(8).toLowerCase();

// this checks clients for the referral code and also community codes we have
const attemptToApplyReferralCode = async (
    userBeingReferred: User,
    referralCode: Maybe<string>
): Promise<FailureOrSuccess<DefaultErrors, Maybe<Referral>>> => {
    if (!userBeingReferred) {
        return success(null);
    }

    // if no code -> claim the default referral. otherwise use the referral code to claim
    if (!referralCode) {
        return failure(new NotFoundError("No referral code provided"));
    }

    const isSpecialCode = await SpecialCodeService.isValidSpecialCode(
        referralCode
    );

    if (isSpecialCode) {
        return await SpecialCodeService.attemptToClaimSpecialCode(
            userBeingReferred,
            referralCode
        );
    }

    // otherwise try to claim from a friends code
    const friendReferralCodeResponse =
        await FriendReferralService.attemptToApplyFriendReferralCodeAndEarnCredit(
            userBeingReferred,
            referralCode
        );

    return friendReferralCodeResponse;
};

const isValidCode = async (
    refCode: Maybe<string>,
    userRequestingId: string
): Promise<boolean> => {
    if (!refCode) return false;

    const isSpecialCode = await SpecialCodeService.isValidSpecialCode(refCode);

    if (isSpecialCode) return true;

    const isValidFriend = await FriendReferralService.isValidFriendReferralCode(
        refCode
    );

    if (isValidFriend) return true;

    return false;
};

export const ReferralService = {
    getReferralCode,
    attemptToApplyReferralCode,
    isValidCode,
};
