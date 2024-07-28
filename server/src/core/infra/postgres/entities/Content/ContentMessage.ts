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
import { Maybe } from "src/core/logic";
import { ContentSession } from "./ContentSession";
import { User } from "../User";
import { Content } from "./Content";

@Entity({
    name: "content_messages",
})
export class ContentMessage {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // content
    @Column({
        nullable: false,
        name: "content",
        type: "text",
    })
    message!: string;

    // audio file
    @Column({
        nullable: true,
        name: "audio_url",
        type: "text",
    })
    audioUrl!: string;

    @Column({
        nullable: false,
        name: "is_bot",
        type: "boolean",
    })
    isBot!: boolean;

    @Column({
        nullable: false,
        name: "content_session_id",
        type: "uuid",
    })
    @Index("content_messages_content_session_id_idx")
    contentSessionId!: string;

    @Column({
        nullable: false,
        name: "user_id",
        type: "uuid",
    })
    @Index("content_messages_user_id_idx")
    userId!: string;

    @Column({
        nullable: false,
        name: "content_id",
        type: "uuid",
    })
    contentId!: string;

    @ManyToOne(() => ContentSession, (t) => t.id, {
        nullable: true,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "content_session_id" })
    contentSession!: Relation<Maybe<ContentSession>>;

    @ManyToOne(() => Content, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "content_session_id" })
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
