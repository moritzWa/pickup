import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
    Relation,
    Index,
} from "typeorm";
import BigNumber from "bignumber.js";
import { Maybe } from "src/core/logic";
import { BIG_NUMBER_TRANSFORMER } from "./utils";
import { User } from "./User";

export enum DepositSource {
    Venmo = "venmo",
}

export enum DepositStatus {
    Pending = "pending",
    Completed = "completed",
    Canceled = "canceled",
    Failed = "failed",
}

@Entity({
    name: "deposits",
})
export class Deposit {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "source",
    })
    source!: DepositSource;

    @Column({
        nullable: true,
        type: "text",
        name: "source_type",
    })
    sourceType!: Maybe<"integration" | "venmo_send">;

    @Column({
        nullable: true,
        type: "text",
        name: "paypal_order_id",
    })
    paypalOrderId!: Maybe<string>;

    // amount
    @Column({
        nullable: false,
        type: "numeric",
        name: "amount",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    amount!: BigNumber;

    // status
    @Column({
        nullable: false,
        type: "enum",
        name: "status",
        enum: DepositStatus,
        enumName: "deposit_status_enum",
    })
    status!: DepositStatus;

    // has sent on solana
    @Column({
        nullable: false,
        type: "boolean",
        name: "has_sent_funds",
        default: false,
    })
    hasSentFunds!: boolean;

    @Column({
        nullable: true,
        type: "text",
        name: "transaction_hash",
    })
    transactionHash!: Maybe<string>;

    @Column({
        nullable: false,
        type: "uuid",
        name: "user_id",
    })
    userId!: string;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

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
}
