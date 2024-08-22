import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { sum } from "radash";
import {
    User as UserModel,
    UserAuthProvider,
} from "src/core/infra/postgres/entities/User";
import * as crypto from "crypto";
import { Maybe } from "src/core/logic";
import { config } from "src/config";

export const UserAuthProviderEnum = enumType({
    name: "UserAuthProviderEnum",
    members: UserAuthProvider,
});

export const User = objectType({
    name: "User",
    definition(t) {
        t.nonNull.string("id");
        t.nullable.string("phoneNumber");
        t.nullable.string("username");
        t.nonNull.boolean("hasVerifiedPhoneNumber");
        t.nonNull.boolean("hasTwoFactorAuth");
        t.nullable.boolean("hasMobile");
        t.nonNull.string("authProviderId");
        t.nullable.boolean("hasPushNotificationsEnabled");
        t.nonNull.string("email");
        t.nullable.string("name");
        t.nullable.string("referredByCode");
        t.nullable.string("referredByName");
        t.nullable.float("number");
        t.nullable.string("avatarImageUrl", {
            resolve: (u) => u.imageUrl,
        });
        t.nullable.string("role");
        t.nonNull.string("description");
        t.nullable.string("referralCode");
        t.field("authProvider", { type: nonNull("UserAuthProviderEnum") });
        t.nonNull.string("authProviderId");

        t.nullable.string("timezone");
        t.nullable.string("commuteTime");

        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
        t.nonNull.boolean("isSuperuser");
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
