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
import { Lesson } from "./Lesson";
import { Participant } from "./Participant";

@Entity({
    name: "sessions",
})
export class Session {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // audio file
    @Column({
        nullable: true,
        name: "audio_url",
        type: "text",
    })
    audioUrl!: string;

    @Column({
        nullable: false,
        name: "lesson_id",
        type: "uuid",
    })
    @Index("sessions_lesson_id_idx")
    lessonId!: string;

    @ManyToOne(() => Lesson, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "lesson_id" })
    lesson!: Relation<Lesson>;

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
