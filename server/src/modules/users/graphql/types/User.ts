import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { sum } from "radash";
import {
    User as UserModel,
    UserAuthProvider,
    UserStatus,
} from "src/core/infra/postgres/entities/User";
import * as crypto from "crypto";
import { Maybe } from "src/core/logic";
import { config } from "src/config";

export const UserStatusEnum = enumType({
    name: "UserStatusEnum",
    members: UserStatus,
});

export const UserAuthProviderEnum = enumType({
    name: "UserAuthProviderEnum",
    members: UserAuthProvider,
});

export const UserWallet = objectType({
    name: "UserWallet",
    definition: (t) => {
        t.field("provider", { type: nonNull("AccountProviderEnum") });
        t.nonNull.string("publicKey");
    },
});

export const User = objectType({
    name: "User",
    definition(t) {
        t.nonNull.string("id");
        t.field("status", { type: nonNull("UserStatusEnum") });
        t.nullable.string("phoneNumber");
        t.nonNull.boolean("hasVerifiedPhoneNumber");
        t.nonNull.boolean("hasTwoFactorAuth");
        t.nullable.boolean("hasMobile");
        t.nonNull.string("authProviderId");
        t.nullable.boolean("hasPushNotificationsEnabled");
        t.nonNull.string("email");
        t.nullable.string("name");
        t.nullable.string("referredByCode");
        t.nullable.string("referredByName");
        // TODO: deprecate but don't rlly wanna fix the clients atm
        t.nullable.float("numberMobileUser", {
            resolve: (u) => u.number,
        });
        t.nullable.float("number");
        t.nullable.string("avatarImageUrl");
        t.nullable.string("role");
        t.nonNull.string("description");
        t.nullable.string("referralCode");
        t.field("authProvider", { type: nonNull("UserAuthProviderEnum") });
        t.nonNull.string("authProviderId");
        t.nonNull.string("username", {
            resolve: (u) => u.username || "",
        });
        t.nonNull.field("swapPrivacyDefault", {
            type: nonNull("SwapPrivacyEnum"),
        });
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
        t.nonNull.boolean("isSuperuser");
        t.nonNull.boolean("isAffiliate");
        t.nullable.boolean("canTradeMobile");
        t.nullable.string("intercomUserHash");
        t.field("intercomUserHash", {
            type: nullable("String"),
            resolve: (u) =>
                _getIntercomUseHash(config.intercom.secretKey, u.id),
        });
        t.field("intercomMobileUserHash", {
            type: nullable("String"),
            resolve: (u) =>
                _getIntercomUseHash(config.intercom.iosSecretKey, u.id),
        });
        t.field("wallets", {
            type: nullable(list(nonNull("UserWallet"))),
            resolve: (u) => u.wallets,
        });
        t.nullable.string("biometricPublicKey");
    },
});

export const PaymentMethod = objectType({
    name: "PaymentMethod",
    definition: (t) => {
        t.nonNull.string("source");
        t.nonNull.string("last4");
        t.nonNull.string("paymentMethodId");
    },
});

const _getIntercomUseHash = (secret: string, userId: string): Maybe<string> => {
    try {
        const hash = crypto
            .createHmac("sha256", secret)
            .update(userId)
            .digest("hex");

        return hash;
    } catch (err) {
        return null;
    }
};
