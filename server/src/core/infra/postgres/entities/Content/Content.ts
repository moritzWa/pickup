import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../User";
import { Category } from "src/modules/content/services/categories";

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
        nullable: true,
        name: "source_image_url",
        type: "text",
    })
    sourceImageUrl!: string | null;

    @Column({
        nullable: false,
        name: "audio_url",
        type: "text",
    })
    audioUrl!: string;

    // estimated length of the audio
    @Column({
        nullable: false,
        name: "length_ms",
        type: "int",
    })
    lengthMs!: number;

    @Column({
        nullable: false,
        name: "categories",
        type: "jsonb",
        default: "[]",
    })
    categories!: string[];

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
