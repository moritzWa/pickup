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
    Relation,
} from "typeorm";
import { User } from "../User";
import { Content } from "./Content";

@Entity({
    name: "content_sessions",
})
export class ContentSession {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // current timestamp
    @Column({
        nullable: true,
        name: "timestamp_cursor",
        type: "numeric",
    })
    timestampCursor!: number | null;

    // is bookmarked
    @Column({
        nullable: false,
        name: "is_bookmarked",
        type: "boolean",
        default: false,
    })
    isBookmarked!: boolean;

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
