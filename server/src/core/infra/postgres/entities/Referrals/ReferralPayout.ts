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
import { BIG_NUMBER_TRANSFORMER } from "../utils";
import BigNumber from "bignumber.js";
import { User } from "../User";
import { Swap } from "../Trading/Swap";

@Entity({
    name: "referral_payouts",
})
export class ReferralPayout {
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
        name: "amount",
    })
    amount!: number;

    @Column({
        nullable: false,
        type: "numeric",
        name: "fiat_amount_cents",
    })
    fiatAmountCents!: number;

    @Column({
        nullable: true,
        type: "uuid",
        name: "user_id",
    })
    userId!: string | null;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User | null>;

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
