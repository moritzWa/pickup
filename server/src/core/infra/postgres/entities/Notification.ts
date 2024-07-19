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
import { User } from "./User";
import { Maybe } from "src/core/logic";
import { AccountProvider } from "./types";

@Entity({
    name: "notifications",
})
export class Notification {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "icon_image_url",
    })
    iconImageUrl!: Maybe<string>;

    @Column({
        nullable: false,
        type: "text",
        name: "title",
    })
    title!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "subtitle",
    })
    subtitle!: string;

    @Column({
        nullable: false,
        type: "boolean",
        name: "has_read",
    })
    hasRead!: boolean;

    @Column({
        default: false,
        type: "boolean",
        name: "has_sent",
    })
    hasSent!: boolean;

    @Column({
        nullable: true,
        name: "idempotency",
        type: "text",
        unique: true,
    })
    idempotency!: Maybe<string>;

    @Column({
        nullable: true,
        name: "follower_user_id",
        type: "uuid",
    })
    followerUserId!: Maybe<string>;

    @Column({
        nullable: true,
        name: "token_contract_address",
        type: "text",
    })
    tokenContractAddress!: Maybe<string>;

    @Column({
        nullable: true,
        name: "token_provider",
        type: "text",
    })
    tokenProvider!: Maybe<AccountProvider>;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "follower_user_id" })
    followerUser!: User | null;

    @Column({
        nullable: false,
        name: "user_id",
        type: "uuid",
    })
    @Index("notifications_user_id_idx")
    userId!: string;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: User;

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
