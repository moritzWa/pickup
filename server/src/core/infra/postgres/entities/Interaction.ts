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
import { Maybe } from "src/core/logic";
import { Content } from "./Content";

export enum InteractionType {
    Likes = "likes",
    Bookmarked = "bookmarked",
    Queued = "queued",
    StartedListening = "started_listening",
    ScrolledPast = "scrolled_past",
    Skipped = "skipped",
    LeftInProgress = "left_in_progress",
    ListenedToBeginning = "listened_to_beginning",
    Finished = "finished",
}

@Entity({
    name: "interactions",
})
@Index(["contentId", "userId", "type"], { unique: true })
export class Interaction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        name: "type",
        type: "enum",
        enum: InteractionType,
        enumName: "interaction_type_enum",
    })
    type!: InteractionType;

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
