import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    Relation,
} from "typeorm";
import { AccountProvider, SwapPrivacy, TradingProvider } from "../types";
import { User } from "../User";
import { Swap } from "../Trading/Swap";

@Entity({
    name: "referral_commissions",
})
@Unique("referral_commissions_hash_chain_idx", ["hash", "chain"])
export class ReferralCommission {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "chain",
    })
    chain!: AccountProvider;

    // hash column
    @Column({
        nullable: false,
        type: "text",
        name: "hash",
    })
    hash!: string;

    @Column({
        nullable: false,
        type: "numeric",
        name: "estimated_swap_fiat_amount",
    })
    estimatedSwapFiatAmountCents!: number;

    @Column({
        nullable: true,
        type: "numeric",
        name: "estimated_fee_fiat_amount_cents",
    })
    estimatedFeeFiatAmountCents!: Maybe<number>;

    @Column({
        nullable: false,
        type: "numeric",
        name: "commission_fiat_amount_cents",
    })
    commissionFiatAmountCents!: number;

    @Column({
        nullable: false,
        type: "uuid",
        name: "swap_id",
    })
    swapId!: string;

    @Column({
        nullable: false,
        type: "uuid",
        name: "referral_id",
    })
    referralId!: string;

    @Column({
        nullable: true,
        type: "uuid",
        name: "trader_user_id",
    })
    traderUserId!: string | null;

    @Column({
        nullable: true,
        type: "uuid",
        name: "commission_recipient_user_id",
    })
    commissionRecipientUserId!: string | null;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "trader_user_id" })
    traderUser!: Relation<User>;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "commission_recipient_user_id" })
    commissionRecipientUser!: Relation<User>;

    @ManyToOne(() => Swap, (t) => t.id, {
        nullable: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "swap_id" })
    swap!: Relation<Swap>;

    // When the transaction actually happened on the blockchain / exchange
    // Note: no default on purpose so it forces the client to specify the date
    // as it can be from an external system
    @Column({
        nullable: false,
        type: "timestamp",
        name: "created_at",
    })
    createdAt!: Date;

    // Note: no default on purpose so it forces the client to specify the date
    // as it can be from an external system
    @Column({
        nullable: false,
        type: "timestamp",
        name: "updated_at",
    })
    updatedAt!: Date;
}
