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
import { Participant } from "./Participant";
import { Course } from "./Course";

export enum LessonType {
    Game = "game",
    Vocabulary = "vocabulary",
    RolePlay = "role_play",
}

@Entity({
    name: "lessons",
})
export class Lesson {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // lesson type
    @Column({
        nullable: false,
        name: "type",
        type: "enum",
        enum: LessonType,
        enumName: "lesson_type_enum",
    })
    type!: LessonType;

    @Column({
        nullable: false,
        name: "title",
        type: "text",
    })
    title!: string;

    @Column({
        nullable: false,
        name: "subtitle",
        type: "text",
    })
    subtitle!: string;

    @Column({
        nullable: false,
        name: "content",
        type: "text",
    })
    content!: string;

    @Column({
        nullable: false,
        name: "participant_id",
        type: "uuid",
    })
    @Index("lesson_participant_id_idx")
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
        name: "course_id",
        type: "uuid",
    })
    @Index("lesson_course_id_idx")
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
