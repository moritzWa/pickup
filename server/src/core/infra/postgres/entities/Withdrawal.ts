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
import { AccountProvider } from "./types";

export enum WithdrawalStatus {
    Pending = "pending",
    Completed = "completed", // completed -> after it is actually received
    SendFunds = "sent_funds", // sent to the address
    Canceled = "canceled",
    Failed = "failed",
}

@Entity({
    name: "withdrawals",
})
export class Withdrawal {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "kado_order_id",
    })
    kadoOrderId!: Maybe<string>;

    // amount
    @Column({
        nullable: false,
        type: "numeric",
        name: "amount",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    amount!: BigNumber;

    @Column({
        nullable: false,
        type: "enum",
        name: "status",
        enum: WithdrawalStatus,
        enumName: "withdrawal_status_enum",
    })
    status!: WithdrawalStatus;

    @Column({
        nullable: true,
        type: "text",
        name: "failed_reason",
    })
    failedReason!: Maybe<string>;

    @Column({
        nullable: false,
        type: "text",
        name: "chain",
    })
    chain!: AccountProvider;

    @Column({
        nullable: true,
        type: "text",
        name: "transaction_hash",
    })
    hash!: Maybe<string>;

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
