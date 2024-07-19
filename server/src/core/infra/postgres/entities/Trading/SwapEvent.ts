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
import { AccountProvider, TradingProvider } from "../types";
import { BIG_NUMBER_TRANSFORMER } from "../utils";
import BigNumber from "bignumber.js";
import { User } from "../User";
import { SwapStatus } from "./Swap";

@Entity({
    name: "swap_events",
})
@Unique("swap_event_hash_status_chain_idx", ["hash", "status", "chain"])
export class SwapEvent {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "chain",
    })
    chain!: AccountProvider;

    @Column({
        nullable: true,
        type: "numeric",
        name: "duration_seconds",
    })
    durationSeconds!: Maybe<number>;

    @Column({
        nullable: false,
        type: "enum",
        enum: SwapStatus,
        enumName: "swap_status_enum",
        name: "status",
    })
    status!: SwapStatus;

    @Column({
        nullable: true,
        type: "boolean",
        name: "is_timed_out",
    })
    isTimedOut!: Maybe<boolean>;

    @Column({
        nullable: true,
        type: "text",
        name: "hash",
    })
    hash!: Maybe<string>;

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

    @Column({
        nullable: true,
        type: "uuid",
        name: "user_id",
    })
    userId!: string | null;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User | null>;
}
