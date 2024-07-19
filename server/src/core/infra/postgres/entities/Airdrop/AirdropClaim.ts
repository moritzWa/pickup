import { Maybe } from "src/core/logic";
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
import { AccountProvider, TransactionStatus } from "../types";
import { Airdrop } from "./Airdrop";

export enum AirdropClaimStatus {
    Pending = "pending", // a person invited but the claim wasn't accepted yet
    Claimed = "claimed", // two people claimed it together
    Succeeded = "succeeded", // the claim was successful and actually sent them the crypto
}

@Entity({
    name: "airdrop_claims",
})
export class AirdropClaim {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "enum",
        enum: AirdropClaimStatus,
        enumName: "airdrop_claim_status_enum",
        name: "status",
    })
    status!: AirdropClaimStatus;

    @Column({
        nullable: false,
        name: "total_amount",
        type: "numeric",
    })
    totalAmount!: number;

    @Column({
        nullable: false,
        name: "inviter_amount",
        type: "numeric",
    })
    inviterAmount!: number;

    @Column({
        nullable: false,
        name: "invited_amount",
        type: "numeric",
    })
    invitedAmount!: number;

    @Column({
        nullable: false,
        name: "code",
        type: "text",
    })
    @Index("airdrop_claims_code_idx", { unique: true })
    code!: string;

    @Column({
        nullable: false,
        name: "chain",
        type: "text",
    })
    chain!: AccountProvider;

    @Column({
        nullable: true,
        name: "transaction_hash",
        type: "text",
    })
    @Index("airdrop_claims_transaction_hash_idx", { unique: true })
    transactionHash!: Maybe<string>;

    @Column({
        nullable: true,
        name: "submitted_at",
        type: "timestamp",
    })
    submittedAt!: Maybe<Date>;

    @Column({
        nullable: true,
        name: "transaction_status",
        type: "text",
    })
    transactionStatus!: Maybe<TransactionStatus>;

    @Column({
        nullable: false,
        type: "uuid",
        name: "airdrop_id",
    })
    @Index("airdrop_claims_airdrop_id_idx")
    airdropId!: string;

    @Column({
        nullable: true,
        name: "inviter_user_id",
        type: "uuid",
    })
    @Index("airdrop_claims_inviter_user_id_idx")
    inviterUserId!: string | null;

    @Column({
        nullable: true,
        name: "invited_user_id",
        type: "uuid",
    })
    @Index("airdrop_claims_invited_user_id_idx")
    invitedUserId!: Maybe<string>;

    @ManyToOne(() => Airdrop, (t) => t.id, { nullable: false, eager: false })
    @JoinColumn({ name: "airdrop_id" })
    airdrop!: Airdrop;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "inviter_user_id" })
    inviter!: User;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "invited_user_id" })
    invited!: User;

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
