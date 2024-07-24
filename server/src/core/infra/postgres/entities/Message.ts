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
import { User } from "./User";
import { Lesson } from "./Lesson/Lesson";
import { Participant } from "./Participant";
import { Maybe } from "src/core/logic";
import { ContentSession } from "./Content";

@Entity({
    name: "messages",
})
export class Message {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // content
    @Column({
        nullable: false,
        name: "content",
        type: "text",
    })
    content!: string;

    // audio file
    @Column({
        nullable: true,
        name: "audio_url",
        type: "text",
    })
    audioUrl?: string;

    // from and to participants
    @Column({
        nullable: false,
        name: "from_participant_id",
        type: "uuid",
    })
    @Index("messages_from_participant_id_idx")
    fromParticipantId!: string;

    @Column({
        nullable: false,
        name: "to_participant_id",
        type: "uuid",
    })
    @Index("messages_to_participant_id_idx")
    toParticipantId!: string;

    @Column({
        nullable: true,
        name: "lesson_id",
        type: "uuid",
    })
    @Index("messages_lesson_id_idx")
    lessonId!: Maybe<string>;

    @Column({
        nullable: true,
        name: "content_session_id",
        type: "uuid",
    })
    @Index("messages_content_session_id_idx")
    contentSessionId!: Maybe<string>;

    @ManyToOne(() => ContentSession, (t) => t.id, {
        nullable: true,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "content_session_id" })
    contentSession!: Relation<Maybe<ContentSession>>;

    @ManyToOne(() => Lesson, (t) => t.id, {
        nullable: true,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "lesson_id" })
    lesson!: Lesson;

    @ManyToOne(() => Participant, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "from_participant_id" })
    fromParticipant!: Relation<Participant>;

    @ManyToOne(() => Participant, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "to_participant_id" })
    toParticipant!: Relation<Participant>;

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
