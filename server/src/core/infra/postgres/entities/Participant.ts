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
import { Course } from "./Course";

export enum ParticipantStatus {
    Active = "active",
    Inactive = "inactive",
}

@Entity({
    name: "participants",
})
export class Participant {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        name: "status",
        enum: ParticipantStatus,
        enumName: "participant_status_enum",
    })
    status!: ParticipantStatus;

    @Column({
        nullable: false,
        name: "course_id",
        type: "uuid",
    })
    @Index("participants_course_id_idx")
    courseId!: string;

    @Column({
        nullable: false,
        name: "user_id",
        type: "uuid",
    })
    @Index("participants_user_id_idx")
    userId!: string;

    @ManyToOne(() => Course, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "course_id" })
    course!: Course;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: User;

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
