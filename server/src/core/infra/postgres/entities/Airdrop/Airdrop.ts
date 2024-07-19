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
import { AccountProvider } from "../types";
import { Maybe } from "src/core/logic";

@Entity({
    name: "airdrops",
})
export class Airdrop {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "symbol",
    })
    symbol!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "icon_image_url",
    })
    iconImageUrl!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "provider",
    })
    provider!: AccountProvider;

    @Column({
        nullable: false,
        type: "text",
        name: "contract_address",
    })
    contractAddress!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "airdrop_pubkey",
    })
    airdropPubkey!: Maybe<string>;

    @Column({
        nullable: false,
        type: "numeric",
        name: "total_amount",
    })
    totalAmount!: number;

    @Column({
        nullable: false,
        type: "numeric",
        name: "amount_per_claim",
    })
    amountPerClaim!: number;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "start_date",
    })
    startDate!: Date;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "end_date",
    })
    endDate!: Date;

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
