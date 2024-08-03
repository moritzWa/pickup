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
import { User } from "../User";
import { Category } from "../types";

export type FollowUpQuestion = {
    id: string;
    question: string;
    answer: string;
};

@Entity({
    name: "content",
})
export class Content {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        name: "context",
        type: "text",
    })
    context!: string;

    @Column({
        nullable: true,
        name: "thumbnail_image_url",
        type: "text",
    })
    thumbnailImageUrl!: string | null;

    @Column({
        nullable: false,
        name: "audio_url",
        type: "text",
    })
    audioUrl!: string;

    // estimated length of the audio
    @Column({
        nullable: false,
        name: "length_seconds",
        type: "int",
    })
    lengthSeconds!: number;

    @Column({
        nullable: false,
        name: "categories",
        type: "jsonb",
        default: "[]",
    })
    categories!: Category[];

    @Column({
        nullable: false,
        name: "author_name",
        type: "text",
    })
    authorName!: string;

    @Column({
        nullable: true,
        name: "author_image_url",
        type: "text",
    })
    authorImageUrl!: string | null;

    @Column({
        nullable: false,
        name: "title",
        type: "text",
    })
    title!: string;

    @Column({
        nullable: true,
        name: "summary",
        type: "text",
    })
    summary!: string | null;

    @Column({
        nullable: false,
        name: "website_url",
        type: "text",
    })
    websiteUrl!: string;

    @Column({
        nullable: false,
        name: "follow_up_questions",
        type: "jsonb",
    })
    followUpQuestions!: FollowUpQuestion[];

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
