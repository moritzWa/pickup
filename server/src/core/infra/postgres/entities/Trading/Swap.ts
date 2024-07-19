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

export enum SwapStatus {
    Pending = "pending",
    Confirmed = "confirmed",
    Finalized = "finalized",
    Failed = "failed",
    Processed = "processed",
}

export enum SwapType {
    Buy = "buy",
    Sell = "sell",
    Unknown = "unknown",
}
export const DEFAULT_SWAP_TYPE = SwapType.Unknown;

@Entity({
    name: "swaps",
})
@Unique("swaps_hash_chain_idx", ["hash", "chain"])
export class Swap {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: true,
        type: "enum",
        enum: TradingProvider,
        enumName: "trading_provider_enum",
        name: "provider",
    })
    provider!: TradingProvider;

    @Column({
        nullable: false,
        type: "text",
        name: "chain",
    })
    chain!: AccountProvider;

    @Column({
        nullable: false,
        type: "text",
        name: "send_symbol",
    })
    sendSymbol!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "send_token_contract_address",
    })
    sendTokenContractAddress!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "receive_symbol",
    })
    receiveSymbol!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "receive_icon_image_url",
    })
    receiveIconImageUrl!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "send_icon_image_url",
    })
    sendIconImageUrl!: Maybe<string>;

    @Column({
        nullable: false,
        type: "text",
        name: "receive_token_contract_address",
    })
    receiveTokenContractAddress!: string;

    @Column({
        nullable: false,
        type: "numeric",
        name: "send_amount",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    sendAmount!: BigNumber;

    @Column({
        nullable: false,
        type: "numeric",
        name: "receive_amount",
        transformer: BIG_NUMBER_TRANSFORMER,
    })
    receiveAmount!: BigNumber;

    @Column({
        nullable: false,
        type: "enum",
        enum: SwapStatus,
        enumName: "swap_status_enum",
        name: "status",
    })
    status!: SwapStatus;

    @Column({
        nullable: false,
        type: "enum",
        enum: SwapType,
        enumName: "swap_type_enum",
        name: "type",
        default: SwapType.Unknown,
    })
    type!: SwapType;

    @Column({
        nullable: false,
        type: "enum",
        enum: SwapPrivacy,
        enumName: "swap_privacy_enum",
        name: "privacy",
        default: SwapPrivacy.Public,
    })
    privacy!: SwapPrivacy;

    @Column({
        nullable: true,
        type: "text",
        name: "failed_reason",
    })
    failedReason!: Maybe<string>;

    // hash column
    @Column({
        nullable: false,
        type: "text",
        name: "hash",
    })
    hash!: string;

    @Column({
        nullable: true,
        type: "uuid",
        name: "quote_id",
    })
    quoteId!: string | null;

    @Column({
        nullable: false,
        type: "numeric",
        name: "estimated_swap_fiat_amount",
    })
    estimatedSwapFiatAmountCents!: number;

    @Column({
        nullable: true,
        type: "numeric",
        name: "estimated_pnl_fiat_amount",
    })
    estimatedPnLFiatAmountCents!: Maybe<number>;

    @Column({
        nullable: true,
        type: "numeric",
        name: "estimated_fee_fiat_amount_cents",
    })
    estimatedFeeFiatAmountCents!: Maybe<number>;

    // When the transaction actually happened on the blockchain / exchange
    // Note: no default on purpose so it forces the client to specify the date
    // as it can be from an external system
    @Column({
        nullable: true,
        type: "timestamp",
        name: "finalized_at",
    })
    finalizedAt!: Maybe<Date>;

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
    @Index("swaps_user_idx", ["userId"])
    userId!: string | null;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;
}
