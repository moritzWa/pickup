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
import { Participant } from "../Participant";
import { Course } from "../Course";
import { Lesson } from "./Lesson";

@Entity({
    name: "lesson_progress",
})
export class LessonProgress {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        name: "participant_id",
        type: "uuid",
    })
    @Index("progress_participant_id_idx")
    participantId!: string;

    @ManyToOne(() => Participant, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "participant_id" })
    participant!: Participant;

    @Column({
        nullable: false,
        name: "lesson_id",
        type: "uuid",
    })
    @Index("progress_lesson_id_idx")
    lessonId!: string;

    @ManyToOne(() => Lesson, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "lesson_id" })
    lesson!: Lesson;

    @Column({
        nullable: false,
        name: "course_id",
        type: "uuid",
    })
    @Index("progress_course_id_idx")
    courseId!: string;

    @ManyToOne(() => Course, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "course_id" })
    course!: Course;

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
