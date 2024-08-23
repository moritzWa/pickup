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

export enum NotificationType {
    NewRecommendations = "new_recommendations",
    GainedFollower = "gained_follower",
}

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
        nullable: true,
        type: "text",
        name: "type",
    })
    type!: Maybe<NotificationType>;

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
        nullable: false,
        name: "user_id",
        type: "uuid",
    })
    @Index("notifications_user_id_idx")
    userId!: string;

    @Column({
        nullable: true,
        name: "follower_user_id",
        type: "uuid",
    })
    followerUserId!: string | null;

    @Column({
        nullable: true,
        name: "feed_insertion_id",
        type: "uuid",
    })
    feedInsertionId!: string | null;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: true,
        eager: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "follower_user_id" })
    followerUser!: User;

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
