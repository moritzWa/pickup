import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Unique,
} from "typeorm";
import { User } from "../User";
import { Maybe } from "src/core/logic";

export const DEFAULT_REFERRAL_AMOUNT_USDC = 5;
export const DEFAULT_REFERRAL_USDC_MINT =
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const DEFAULT_REFERRAL_USDC_SYMBOL = "USDC";
export const DEFAULT_REFERRAL_USDC_ICON_IMAGE_URL =
    "https://assets.movement.market/coins/usdc.png";

@Entity({
    name: "referrals",
})
@Unique("referrals_pair_unique_idx", ["referredByUserId", "referredUserId"])
export class Referral {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_claimed_reward",
    })
    hasClaimedReward!: boolean;

    @Column({
        nullable: true,
        type: "text",
        name: "reward_token_symbol",
    })
    rewardTokenSymbol!: Maybe<string>;

    @Column({
        nullable: true,
        type: "numeric",
        name: "reward_amount",
    })
    rewardAmount!: Maybe<number>;

    @Column({
        nullable: true,
        type: "text",
        name: "reward_token_contract_address",
    })
    rewardTokenContractAddress!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "reward_token_icon_image_url",
    })
    rewardTokenIconImageUrl!: Maybe<string>;

    @Column({
        nullable: true,
        type: "timestamp",
        name: "reward_claimed_at",
    })
    rewardClaimedAt!: Maybe<Date>;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_deposit_successful",
    })
    isDepositSuccessful!: boolean;

    @Column({
        nullable: true,
        type: "text",
        name: "reward_transaction_hash",
    })
    rewardTransactionHash!: Maybe<string>;

    @Column({
        nullable: false,
        name: "referred_user_id",
    })
    @Index("referrals_referred_user_id_idx")
    referredUserId!: string;

    @Column({
        nullable: false,
        name: "referred_by_user_id",
    })
    @Index("referrals_referred_by_user_id_idx")
    referredByUserId!: string;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "referred_by_user_id" })
    referredByUser!: User;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "referred_user_id" })
    referredUser!: User;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt!: Date;

    @DeleteDateColumn({
        name: "deleted_at",
    })
    deletedAt?: Date;
}
