import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Relation,
    Unique,
} from "typeorm";
import { nanoid } from "nanoid";
import { isString } from "lodash";
import { Helpers } from "src/utils";
import { AccountProvider, SwapPrivacy } from "../types";
import { BIG_NUMBER_TRANSFORMER } from "../utils";
import BigNumber from "bignumber.js";

export const DEFAULT_COMMISSION_PERCENT = new BigNumber(0.3); // 30% of the trading revenue we collect goes to them

export enum UserRole {
    User = "user",
    BasicAdmin = "basic_admin",
}

// make them see yellow dot when they first create acc
export const DEFAULT_READ_FRIENDS_UNTIL = new Date("2021-01-01");

export enum UserStatus {
    User = "user",
    Pending = "pending",
}

export enum UserAuthProvider {
    Firebase = "firebase",
    Magic = "magic",
}

export type Flag = {
    type: "portfolio";
};

export type FeatureFlags = {
    flags: Flag[];
};

export type UserWallet = {
    provider: AccountProvider;
    publicKey: string;
};

// in the future we may want to add more referral reward types, ex. a lottery where you
// win a variable amount
export enum ReferralRewardType {
    FlatAmount = "flat_amount",
}

@Entity({
    name: "users",
})
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "enum",
        name: "status",
        enum: UserStatus,
        enumName: "user_status_enum",
        default: UserStatus.User,
    })
    status!: UserStatus;

    @Column({
        nullable: true,
        type: "text",
        name: "phone_number",
    })
    // @Index("users_phone_number_idx", { unique: true })
    phoneNumber!: Maybe<string>;

    @Column({
        nullable: false,
        type: "numeric",
        default: 0,
        name: "unread_count",
    })
    unreadCount!: number;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_claimed_initial_deposit",
    })
    hasClaimedInitialDeposit!: boolean;

    @Column({
        nullable: true,
        type: "text",
        name: "initial_deposit_token_symbol",
    })
    initialDepositTokenSymbol!: Maybe<string>;

    @Column({
        nullable: true,
        type: "numeric",
        name: "initial_deposit_amount",
    })
    initialDepositAmount!: Maybe<number>;

    @Column({
        nullable: true,
        type: "timestamp",
        name: "initial_deposit_claimed_at",
    })
    initialDepositClaimedAt!: Maybe<Date>;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_initial_deposit_successful",
    })
    isInitialDepositSuccessful!: boolean;

    @Column({
        nullable: true,
        type: "text",
        name: "initial_deposit_transaction_hash",
    })
    initialDepositTransactionHash!: Maybe<string>;

    @Column({
        nullable: false,
        default: 0,
        type: "numeric",
        name: "commission_percentage",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    commissionPercentage!: BigNumber;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_verified_phone_number",
    })
    hasVerifiedPhoneNumber!: boolean;

    @Column({
        nullable: true,
        type: "text",
        name: "biometric_public_key",
    })
    biometricPublicKey!: Maybe<string>;

    @Column({
        nullable: false,
        type: "text",
        name: "email",
    })
    @Index({ unique: true })
    email!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "name",
    })
    name!: Maybe<string>;

    @Column({
        default: null,
        nullable: true,
        unique: true,
        type: "text",
        name: "username",
    })
    @Index("users_username_idx")
    username!: Maybe<string>;

    @Column({
        default: false,
        nullable: false,
        type: "boolean",
        name: "username_synced",
    })
    @Index("users_username_synced_idx")
    usernameSynced!: boolean;

    @Column({
        default: "",
        nullable: false,
        type: "text",
        name: "description",
    })
    description!: string; // Founder of Movement. I lose a lot of money on this app. Not financial advice.

    @Column({
        default: "",
        nullable: false,
        type: "text",
        name: "referral_code",
    })
    @Index("users_referral_code_idx")
    referralCode!: string;

    // the amount you get for their referral
    @Column({
        nullable: false,
        type: "text",
        name: "referral_reward_type",
        default: ReferralRewardType.FlatAmount,
    })
    referralRewardType!: ReferralRewardType;

    @Column({
        nullable: true,
        type: "numeric",
        name: "referral_reward_amount",
    })
    referralRewardAmount!: Maybe<number>;

    @Column({
        nullable: true,
        type: "text",
        name: "avatar_image_url",
    })
    avatarImageUrl!: Maybe<string>;

    // the amount of available credit they can use that exists as a credit balance in stripe
    @Column({
        nullable: false,
        default: 0,
        type: "numeric",
        name: "available_credit_cents",
    })
    availableCreditCents!: number;

    @Column({
        nullable: false,
        type: "enum",
        name: "auth_provider",
        enum: UserAuthProvider,
        enumName: "auth_provider_enum",
    })
    authProvider!: UserAuthProvider;

    @Column({
        nullable: false,
        type: "text",
        name: "auth_provider_id",
    })
    @Index()
    authProviderId!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "magic_issuer",
    })
    @Index("users_magic_issuer_idx")
    magicIssuer!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "mobile_app_version",
    })
    mobileAppVersion!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "mobile_platform",
    })
    mobilePlatform!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "mobile_device_id",
    })
    mobileDeviceId!: Maybe<string>;

    @Column({
        nullable: false,
        type: "boolean",
        name: "can_venmo_deposit",
        default: true,
    })
    canVenmoDeposit!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        name: "can_withdraw",
        default: true,
    })
    canWithdraw!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        name: "can_withdraw_without_token_account",
        default: false,
    })
    canWithdrawWithoutTokenAccount!: boolean;

    @Column({
        nullable: false,
        type: "numeric",
        name: "max_daily_withdrawals",
        default: 3,
    })
    maxDailyWithdrawals!: number;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_two_factor_auth",
    })
    hasTwoFactorAuth!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_mobile",
    })
    @Index("users_has_mobile_idx")
    hasMobile!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_push_notifications_enabled",
    })
    hasPushNotificationsEnabled!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        default: true,
        name: "can_trade_mobile",
    })
    canTradeMobile!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        default: true,
        name: "can_trade",
    })
    canTrade!: boolean;

    // the number user they were, ex. #1 means they were the first user
    @Column({
        nullable: true,
        type: "integer",
        name: "number",
    })
    number!: Maybe<number>;

    @Column({
        nullable: true,
        type: "text",
        name: "referred_by_code",
    })
    referredByCode!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "referred_by_name",
    })
    referredByName!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "stripe_customer_id",
    })
    stripeCustomerId!: Maybe<string>;

    // wallets field that is a json list of the provider + public key of wallets UserWallet
    @Column({
        nullable: true,
        type: "jsonb",
        name: "wallets",
    })
    wallets!: Maybe<UserWallet[]>;

    @Column({
        nullable: true,
        type: "numeric",
        name: "estimated_portfolio_value_cents",
    })
    estimatedPortfolioValueCents!: Maybe<number>;

    @Column({
        nullable: false,
        type: "enum",
        enum: SwapPrivacy,
        enumName: "swap_privacy_enum",
        name: "swap_privacy_default",
        default: SwapPrivacy.Public,
    })
    swapPrivacyDefault!: SwapPrivacy;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "read_friends_until",
        default: () => "NOW()",
    })
    readFriendsUntil!: Date;

    @Column({
        nullable: false,
        type: "boolean",
        name: "is_influencer",
        default: false,
    })
    isInfluencer!: boolean;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "created_at",
        default: () => "NOW()",
    })
    createdAt!: Date;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "updated_at",
        default: () => "NOW()",
    })
    updatedAt!: Date;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_superuser",
    })
    isSuperuser!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_banned",
    })
    isBanned!: boolean;

    @Column({
        nullable: false,
        type: "enum",
        name: "role",
        enum: UserRole,
        enumName: "user_role_enum",
        default: UserRole.User,
    })
    role!: UserRole;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_affiliate",
    })
    isAffiliate!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_emailed_feedback",
    })
    hasEmailedFeedback!: boolean;
}
