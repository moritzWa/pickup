import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    ManyToOne,
    JoinColumn,
    Relation,
} from "typeorm";
import { ContentSession } from "./Content";

export enum UserRole {
    User = "user",
    BasicAdmin = "basic_admin",
}

export enum UserAuthProvider {
    Firebase = "firebase",
}

@Entity({
    name: "users",
})
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

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
        name: "has_verified_phone_number",
    })
    hasVerifiedPhoneNumber!: boolean;

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

    @Column({
        nullable: true,
        type: "text",
        name: "image_url",
    })
    imageUrl!: Maybe<string>;

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
        nullable: true,
        type: "boolean",
        default: false,
        name: "username",
    })
    @Index("users_username_idx")
    username!: string | null;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_push_notifications_enabled",
    })
    hasPushNotificationsEnabled!: boolean;

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

    @Column({
        nullable: false,
        type: "boolean",
        name: "is_influencer",
        default: false,
    })
    isInfluencer!: boolean;

    @Column({
        nullable: true,
        name: "current_content_session_id",
        type: "uuid",
    })
    currentContentSessionId!: Maybe<string>;

    @ManyToOne(() => ContentSession, (t) => t.id, {
        nullable: true,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "current_content_session_id" })
    currentContentSession!: Maybe<Relation<ContentSession>>;

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
        type: "enum",
        name: "role",
        enum: UserRole,
        enumName: "user_role_enum",
        default: UserRole.User,
    })
    role!: UserRole;
}
