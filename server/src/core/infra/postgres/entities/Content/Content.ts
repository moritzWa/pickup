import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
    UpdateDateColumn,
} from "typeorm";
import { Author } from "../Author/Author";
import { ContentChunk } from "./ContentChunk";

export type FollowUpQuestion = {
    id: string;
    question: string;
    answer: string;
};

export enum ContentType {
    ARTICLE = "article",
    PODCAST = "podcast",
}

@Entity({
    name: "content",
})
export class Content {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        name: "type",
        type: "enum",
        enum: ContentType,
        default: ContentType.ARTICLE,
    })
    type!: ContentType;

    @Column({
        nullable: true,
        name: "content",
        type: "text",
    })
    content!: string | null;

    @Column({
        nullable: true,
        name: "content_as_markdown",
        type: "text",
    })
    contentAsMarkdown!: string | null;

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
        name: "audio_url",
        type: "text",
    })
    audioUrl!: string | null;

    // estimated length of the audio
    @Column({
        nullable: true,
        name: "length_ms",
        type: "int",
    })
    lengthMs!: number | null;

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
        name: "categories",
        type: "jsonb",
        default: "[]",
    })
    categories!: string[];

    @ManyToMany(() => Author, (author) => author.contents, {
        cascade: true,
        eager: true,
    })
    authors!: Author[];

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
        unique: true,
    })
    referenceId!: string | null;

    @OneToMany(() => ContentChunk, (t) => t.content)
    // join on the content_id column of the chunks table
    chunks!: Relation<ContentChunk[]>;

    @Column({
        name: "released_at", // aka published at
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

    // Content scraping related

    @Column({ nullable: true })
    excerpt?: string;

    @Column({ nullable: true })
    length?: number; // length in characters

    // mozilla/readability
    @Column({ nullable: true })
    skippedNotProbablyReadable?: boolean;

    @Column({ nullable: true })
    skippedInaccessiblePDF?: boolean;

    @Column({ nullable: true })
    skippedErrorFetchingFullText?: boolean;

    @Column({ nullable: true })
    deadLink?: boolean;

    // pdf
    @Column({ nullable: true })
    totalPagesIfPDF?: number;

    @Column({ nullable: true })
    fetchedPagesIfPDF?: number;

    // TODO remove these?

    // this was intented to be the picture
    @Column({
        nullable: true,
        name: "source_image_url",
        type: "text",
    })
    sourceImageUrl!: string | null; // not used

    @Column({
        // remove (moved to ContentChunk)
        name: "embedding",
        nullable: true,
        type: "vector" as any,
        // select: false,
    })
    embedding?: any | null;

    @Column({
        // TODO: remove this column?
        nullable: true,
        name: "context",
        type: "text",
        select: false,
    })
    context?: string;
}
