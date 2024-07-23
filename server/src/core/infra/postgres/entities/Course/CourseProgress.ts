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
import { Participant } from "../Participant";
import { Course } from "./Course";
import { User } from "../User";
import { Maybe } from "src/core/logic";
import { Lesson } from "../Lesson";

@Entity({
    name: "course_progress",
})
@Index(["courseId", "userId"], { unique: true })
export class CourseProgress {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: true,
        name: "most_recent_lesson_id",
        type: "uuid",
    })
    mostRecentLessonId!: Maybe<string>;

    @ManyToOne(() => Lesson, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "most_recent_lesson_id" })
    mostRecentLesson!: Lesson;

    @Column({
        nullable: false,
        name: "course_id",
        type: "uuid",
    })
    courseId!: string;

    @Column({
        nullable: false,
        name: "user_id",
        type: "uuid",
    })
    userId!: string;

    @ManyToOne(() => Course, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "course_id" })
    course!: Relation<Course>;

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
