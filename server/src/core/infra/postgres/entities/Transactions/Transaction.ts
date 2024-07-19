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
import { BIG_NUMBER_TRANSFORMER } from "../utils";
import BigNumber from "bignumber.js";
import { Transfer } from "./Transfer";
import { User } from "../User";
import { TransactionType } from "../types";

@Entity({
    name: "transactions",
})
@Index("transaction_user_id_index", ["userId"])
@Unique("transaction_user_hash_idx", ["userId", "hash"])
export class Transaction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "enum",
        name: "type",
        enum: TransactionType,
        enumName: "transaction_type_enum",
    })
    type!: TransactionType;

    @Column({
        nullable: false,
        type: "text",
        name: "hash",
    })
    hash!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "provider",
    })
    provider!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "description",
    })
    description!: Maybe<string>;

    @Column({
        nullable: false,
        type: "text",
        name: "block_explorer_url",
    })
    blockExplorerUrl!: string;

    @Column({
        nullable: false,
        type: "numeric",
        name: "fee_paid_amount",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    feePaidAmount!: BigNumber;

    // transfers table join to the transactions
    @OneToMany(() => Transfer, (transfer) => transfer.transaction)
    transfers!: Transfer[];

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
