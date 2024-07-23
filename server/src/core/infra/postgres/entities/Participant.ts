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
import { Course } from "./Course/Course";
import { Maybe } from "src/core/logic";
import { Character } from "./Character";

export enum ParticipantStatus {
    Active = "active",
    Inactive = "inactive",
}

@Entity({
    name: "participants",
})
// unique course + user
@Unique("participants_course_id_user_id_unique", ["courseId", "userId"])
// for character and course
@Unique("participants_character_id_course_id_unique", [
    "characterId",
    "courseId",
])
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

    // is bot
    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_bot",
    })
    isBot!: boolean;

    @Column({
        nullable: false,
        name: "course_id",
        type: "uuid",
    })
    courseId!: string;

    @Column({
        nullable: true,
        name: "user_id",
        type: "uuid",
    })
    userId!: Maybe<string>;

    @Column({
        nullable: true,
        name: "character_id",
        type: "uuid",
    })
    characterId!: Maybe<string>;

    @ManyToOne(() => Character, (t) => t.id, {
        nullable: true,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "character_id" })
    character!: Maybe<Relation<Character>>;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: true,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Maybe<Relation<User>>;

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
