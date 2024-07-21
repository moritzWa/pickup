import { auth } from "firebase-admin";
import { UserService } from "./userService";
import { v4 as uuidv4 } from "uuid";
import {
    User,
    UserAuthProvider,
    UserRole,
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

type CreateFullUserParams = {
    fbUser: auth.UserRecord;
    name: string | null;
    email: string;
    referredByCode: Maybe<string> | undefined;
};

export const createFullUser = async ({
    email,
    name,
    fbUser,
    referredByCode,
}: CreateFullUserParams): Promise<
    FailureOrSuccess<
        DefaultErrors,
        {
            user: User;
            token: string;
        }
    >
> => {
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
        hasTwoFactorAuth: false,
        isInfluencer: false,
        authProvider: UserAuthProvider.Firebase,
        authProviderId: fbUser.uid,
        unreadCount: 0,
        hasVerifiedPhoneNumber: false,
        name: name || "",
        description: "",
        email: email,
        mobileAppVersion: null,
        mobileDeviceId: null,
        phoneNumber: null,
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSuperuser: false,
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
        // random character generated
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
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
