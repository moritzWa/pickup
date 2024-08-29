import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../User";
import { Content } from "./Content";

@Entity({
    name: "content_sessions",
})
@Index("user_bookmarked_at_idx", { synchronize: false })
@Index("user_last_listened_at_idx", { synchronize: false })
@Index("session_content_user_id_idx", ["userId", "contentId"])
export class ContentSession {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // current timestamp
    @Column({
        nullable: true,
        name: "current_ms",
        type: "numeric",
    })
    currentMs!: number | null;

    @Column({
        nullable: true,
        name: "duration_ms",
        type: "numeric",
    })
    durationMs!: number | null;

    // is bookmarked
    @Column({
        nullable: false,
        name: "is_bookmarked",
        type: "boolean",
        default: false,
    })
    isBookmarked!: boolean;

    // is disliked
    @Column({
        nullable: false,
        name: "is_disliked",
        type: "boolean",
        default: false,
    })
    isDisliked!: boolean;

    // bookmarked at
    @Column({
        nullable: true,
        name: "bookmarked_at",
        type: "timestamp",
    })
    bookmarkedAt!: Date | null;

    @Column({
        nullable: true,
        name: "disliked_at",
        type: "timestamp",
    })
    dislikedAt!: Date | null;

    @Column({
        nullable: true,
        name: "last_listened_at",
        type: "timestamp",
    })
    lastListenedAt!: Date | null;

    @Column({
        nullable: false,
        name: "is_liked",
        type: "boolean",
        default: false,
    })
    isLiked!: boolean;

    @Column({
        nullable: true,
        name: "percent_finished",
        type: "numeric",
        // 1 to 100
    })
    percentFinished!: number | null;

    //notes
    @Column({
        nullable: true,
        name: "notes",
        type: "text",
    })
    notes!: string | null;

    @Column({
        nullable: false,
        name: "content_id",
        type: "uuid",
    })
    contentId!: string;

    @Column({
        nullable: false,
        name: "user_id",
        type: "uuid",
    })
    userId!: string;

    @ManyToOne(() => Content, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "content_id" })
    content!: Relation<Content>;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

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
