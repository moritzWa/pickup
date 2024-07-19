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
import { Swap } from "./Swap";

@Entity({
    name: "swap_fees",
})
@Unique("swaps_fees_hash_chain_idx", ["hash", "chain"])
export class SwapFee {
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
        nullable: true,
        type: "numeric",
        name: "estimated_fee_fiat_amount_revenue_cents",
    })
    estimatedFeeFiatAmountRevenueCents!: Maybe<number>;

    @Column({
        nullable: true,
        type: "uuid",
        name: "swap_id",
    })
    swapId!: string | null;

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
