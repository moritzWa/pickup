import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../User";
import { Category } from "src/modules/content/services/categories";
import { ContentChunk } from "./ContentChunk";

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
        nullable: false,
        name: "content",
        type: "text",
    })
    content!: string;

    @Column({
        nullable: true,
        name: "insertion_id",
        type: "text",
    })
    insertionId!: string | null;

    @Column({
        nullable: false,
        name: "is_processed",
        type: "boolean",
        default: false,
    })
    isProcessed!: boolean;

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
        name: "embedding",
        nullable: true,
        type: "vector" as any,
    })
    embedding!: any | null;

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

    @Column({
        nullable: true,
        name: "reference_id",
        type: "text",
    })
    referenceId!: string | null;

    @OneToMany(() => ContentChunk, (t) => t.content, {
        eager: false,
    })
    chunks!: Relation<ContentChunk[]>;

    @Column({
        name: "released_at",
        nullable: true,
        type: "timestamp",
    })
    releasedAt!: Date | null;

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
