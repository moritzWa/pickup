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
import { Lesson } from "./Lesson";
import { Participant } from "../Participant";
import { Course } from "../Course";

@Entity({
    name: "lesson_sessions",
})
export class LessonSession {
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

    @Column({
        nullable: false,
        name: "course_id",
        type: "uuid",
    })
    @Index("sessions_course_id_idx")
    courseId!: string;

    @Column({
        nullable: false,
        name: "user_id",
        type: "uuid",
    })
    @Index("sessions_user_id_idx")
    userId!: string;

    @ManyToOne(() => Lesson, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "lesson_id" })
    lesson!: Relation<Lesson>;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

    @ManyToOne(() => Course, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "course_id" })
    course!: Relation<Course>;

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
