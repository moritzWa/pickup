import { dataSource, startTransaction } from "src/core/infra/postgres";
import { User } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    success,
    UnexpectedError,
} from "src/core/logic";
import { UserService } from "src/modules/users/services";
import { AnalyticsService, EventName } from "src/shared/analyticsService";
import { D } from "src/utils";
import { getNewCreditAmount } from "./utils";

const DOLLARS_50 = 50 * 100;
const DOLLARS_100 = 100 * 100;
const DEFAULT_CREDIT_DOLLARS = 5 * 100; // default is $5
const DOLLARS_25 = 25 * 100;

type ValidCodeInfo = {
    name: string;
    code: string;
    // numTxns: number;
    numCredit: number;
    shouldSetOnUser: boolean;
    restrictedUserIds: Maybe<Set<string>>;
}[];

const influencers: string[] = [];

const VALID_REFERRAL_CODES: ValidCodeInfo = [
    ...influencers.map((code) => ({
        name: code,
        code: code.toLowerCase().replace(" ", ""),
        // numTxns: 100,
        shouldSetOnUser: true,
        numCredit: DEFAULT_CREDIT_DOLLARS,
        restrictedUserIds: null,
    })),
];

const isValidSpecialCode = async (
    _referralCode: Maybe<string>
): Promise<boolean> => {
    if (!_referralCode) {
        return false;
    }

    const referralCode = _referralCode.toLowerCase();
    const refCodeInfo = VALID_REFERRAL_CODES.find(
        (r) => r.code === referralCode
    );

    return !!refCodeInfo;
};

const attemptToClaimSpecialCode = async (
    userBeingReferred: User,
    _referralCode: Maybe<string>
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    const userRequestingId = userBeingReferred.id;
    const isValid = isValidSpecialCode(_referralCode);

    if (!isValid) {
        return failure(new Error("Not a valid special code!"));
    }

    const referralCode = _referralCode!.toLowerCase();
    const refCodeInfo = VALID_REFERRAL_CODES.find(
        (r) => r.code === referralCode
    );

    if (!refCodeInfo) {
        return failure(new Error("Invalid special code: " + referralCode));
    }

    // if the code has restricted ids but the user isn't included
    if (
        refCodeInfo.restrictedUserIds &&
        !refCodeInfo.restrictedUserIds.has(userRequestingId)
    ) {
        return failure(
            new Error(
                "You don't have permission to use this code: " + referralCode
            )
        );
    }

    try {
        await dataSource.transaction(async (dbTxn) => {
            if (userBeingReferred.referredByCode) {
                throw new Error("Sorry, you've already used a special code!");
            }

            // if should set it on the user update the user + their client
            if (refCodeInfo.shouldSetOnUser) {
                if (!!userBeingReferred.referredByCode) {
                    throw new Error(
                        "Sorry, you've already used a special code!"
                    );
                }

                // if the user doesn't have a referred by code set -> update it so we noted how the user was referred to us
                if (!userBeingReferred.referredByCode) {
                    const userResponse = await UserService.update(
                        userBeingReferred.id,
                        {
                            referredByCode: referralCode,
                            referredByName: refCodeInfo?.name || null,
                        },
                        dbTxn
                    );

                    if (userResponse.isFailure()) {
                        throw userResponse.error;
                    }
                }

                const awardedCredit = getNewCreditAmount(
                    userBeingReferred,
                    refCodeInfo.numCredit
                );

                console.log(`[new client credit ${awardedCredit}]`);

                const clientResponse = await UserService.update(
                    userBeingReferred.id,
                    {
                        referredByCode: referralCode,
                        referredByName: refCodeInfo?.name || null,
                        availableCreditCents: awardedCredit,
                    },
                    dbTxn
                );

                if (clientResponse.isFailure()) {
                    throw clientResponse.error;
                }
            }
        });

        void AnalyticsService.track({
            userId: userBeingReferred.id,
            eventName: EventName.ReferralClaimed,
            properties: { type: "special_code", code: referralCode },
        });

        return success(null);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const SpecialCodeService = {
    attemptToClaimSpecialCode,
    isValidSpecialCode,
};
