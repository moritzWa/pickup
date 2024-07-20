import { auth } from "firebase-admin";
import { UserService } from "./userService";
import { v4 as uuidv4 } from "uuid";
import {
    DEFAULT_COMMISSION_PERCENT,
    DEFAULT_READ_FRIENDS_UNTIL,
    ReferralRewardType,
    User,
    UserAuthProvider,
    UserRole,
    UserStatus,
} from "src/core/infra/postgres/entities/User";
import { MagicUserMetadata } from "@magic-sdk/admin";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    success,
} from "src/core/logic";
import {
    throwIfError,
    throwIfErrorAndDatadog,
} from "src/core/surfaces/graphql/common";
import { FirebaseProvider } from "src/shared/authorization/firebaseProvider";
import { AnalyticsService, EventName } from "src/shared/analyticsService";
import { Datadog } from "src/utils";
import { UserNotificationService } from "./userNotificationService";
import { config } from "src/config";
import { DEFAULT_SWAP_PRIVACY } from "src/core/infra/postgres/entities";

const BLACK_LISTED = [];

export const createFullUser = async (
    fbUser: auth.UserRecord,
    magicUser: MagicUserMetadata,
    name: string | null,
    referredByCode: Maybe<string> | undefined,
    _username: Maybe<string> | undefined
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            user: User;
            token: string;
        }
    >
> => {
    if (!magicUser.issuer) {
        return failure(new Error("Missing issuer"));
    }

    if (!magicUser.email) {
        return failure(new Error("Missing email"));
    }

    // check username
    const username = _username;

    // const usernameCheck = await ProfileService.checkValidUsername(
    //     username,
    //     null
    // );
    // if (usernameCheck.isFailure()) {
    //     return failure(usernameCheck.error);
    // }

    // create user
    const userResponse = await UserService.create({
        id: uuidv4(),
        commissionPercentage: DEFAULT_COMMISSION_PERCENT, // half a percent commissh
        canTrade: true,
        canWithdrawWithoutTokenAccount: true,
        hasTwoFactorAuth: false,
        isInfluencer: false,
        canWithdraw: true,
        maxDailyWithdrawals: 3,
        canTradeMobile: true,
        authProvider: UserAuthProvider.Firebase,
        authProviderId: fbUser.uid,
        magicIssuer: magicUser.issuer,
        unreadCount: 0,
        hasVerifiedPhoneNumber: false,
        hasClaimedInitialDeposit: false,
        initialDepositClaimedAt: null,
        initialDepositTokenSymbol: null,
        initialDepositAmount: null,
        referralRewardType: ReferralRewardType.FlatAmount,
        referralRewardAmount: 0,
        initialDepositTransactionHash: null,
        isInitialDepositSuccessful: false,
        name: name || "",
        username: "",
        usernameSynced: false,
        description: "",
        email: magicUser.email,
        isAffiliate: false,
        status: UserStatus.User,
        mobileAppVersion: null,
        mobileDeviceId: null,
        canVenmoDeposit: true,
        estimatedPortfolioValueCents: null,
        wallets: null,
        phoneNumber: null,
        swapPrivacyDefault: DEFAULT_SWAP_PRIVACY,
        avatarImageUrl: null,
        readFriendsUntil: DEFAULT_READ_FRIENDS_UNTIL,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSuperuser: false,
        isBanned: false,
        hasEmailedFeedback: false,
        mobilePlatform: null,
        stripeCustomerId: null,
        // Note: do not fill these out. we will attempt to fill them out below
        // by applying the referral code if we can. if it is here -> the referral code below will fail
        // bc it will already be set on the user
        referredByCode: null,
        referredByName: null,
        role: UserRole.User,
        hasMobile: true,
        hasPushNotificationsEnabled: false,
        biometricPublicKey: null,
        referralCode: username?.toLowerCase() || "",
        availableCreditCents: 0,
    });

    throwIfErrorAndDatadog(userResponse, {
        datadogMetric: "users.created.err",
        datadogTags: { type: "create_user" },
    });

    const { user } = userResponse.value;

    const tokenResponse = await FirebaseProvider.signToken(fbUser.uid);
    throwIfError(tokenResponse);
    const token = tokenResponse.value;

    // claim a code if there is one to give the user free packs from community or friends codes
    // await ReferralService.attemptToApplyReferralCode(
    //     user,
    //     referredByCode || null
    // );

    await UserService.logToSlack(user, null);

    void AnalyticsService.track({
        eventName: EventName.UserCreated,
        userId: user.id,
        properties: {
            name: user.name,
            user_id: user.id,
            referred_by_code: user.referredByCode || "none",
            provider: "social_login",
            is_mobile: user.hasMobile,
        },
    });

    await UserNotificationService.sendWelcomeEmail(user);

    Datadog.increment("users.created.ok");

    return success({
        user,
        token,
    });
};
