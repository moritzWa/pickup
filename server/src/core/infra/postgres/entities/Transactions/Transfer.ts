import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
    Relation,
    Index,
} from "typeorm";
import { BIG_NUMBER_TRANSFORMER } from "../utils";
import BigNumber from "bignumber.js";
import { AccountProvider, TransferType } from "../types";
import { Transaction } from "./Transaction";
import { User } from "../User";
import { Maybe } from "src/core/logic";

@Entity({
    name: "transfers",
})
@Index("transfers_token_contract_address_provider_idx", [
    "tokenContractAddress",
    "provider",
])
@Index("transfers_user_token_contract_address_provider_idx", [
    "userId",
    "tokenContractAddress",
    "provider",
])
export class Transfer {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "enum",
        name: "type",
        enum: TransferType,
        enumName: "transfer_type_enum",
    })
    type!: TransferType;

    @Column({
        nullable: false,
        type: "numeric",
        name: "amount",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    amount!: BigNumber;

    @Column({
        nullable: true,
        type: "numeric",
        name: "fiat_amount_cents",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    fiatAmountCents!: Maybe<BigNumber>;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_looked_up_fiat_amount",
    })
    hasLookedUpFiatAmount!: boolean;

    @Column({
        nullable: true,
        type: "text",
        name: "from",
    })
    from!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "to",
    })
    to!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "symbol",
    })
    symbol!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "icon_image_url",
    })
    iconImageUrl!: string;

    @Column({
        nullable: false,
        type: "integer",
        name: "decimals",
    })
    decimals!: number;

    @Column({
        nullable: false,
        type: "text",
        name: "provider",
    })
    provider!: AccountProvider;

    @Column({
        nullable: false,
        type: "text",
        name: "token_contract_address",
    })
    tokenContractAddress!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "token_identifier",
    })
    tokenIdentifier!: string;

    @Column({
        nullable: false,
        type: "uuid",
        name: "transaction_id",
    })
    transactionId!: string;

    @ManyToOne(() => Transaction, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "transaction_id" })
    transaction!: Relation<Transaction>;

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
