import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import type { CuriusComment } from "./CuriusComment";
import { CuriusHighlight } from "./CuriusHighlight";
import { CuriusLinkChunk } from "./CuriusLinkChunk";
import { CuriusUser } from "./CuriusUser";

@Entity({ name: "curius_links" })
export class CuriusLink {
    @PrimaryColumn()
    id!: number;

    @Column()
    link!: string;

    @Column()
    title!: string;

    @Column({ type: "text", name: "full_text", nullable: true })
    fullText?: string;

    @OneToMany(() => CuriusLinkChunk, (chunk) => chunk.link, { lazy: true })
    chunks!: Promise<CuriusLinkChunk[]>;

    @Column({ nullable: true })
    snippet?: string;

    // mozilla/readability
    @Column({ nullable: true })
    skippedNotProbablyReadable?: boolean;

    @Column({ nullable: true })
    skippedInaccessiblePDF?: boolean;

    @Column({ nullable: true })
    skippedErrorFetchingFullText?: boolean;

    @Column({ nullable: true })
    length?: number;

    @Column({ nullable: true })
    excerpt?: string;

    @Column({ nullable: true })
    byline?: string;

    @Column({ nullable: true })
    dir?: string;

    @Column({ nullable: true })
    siteName?: string;

    @Column({ nullable: true })
    lang?: string;

    @Column({ nullable: true })
    publishedTime?: string;

    // pdf
    @Column({ nullable: true })
    totalPagesIfPDF?: number;

    @Column({ nullable: true })
    fetchedPagesIfPDF?: number;

    // other curius fields
    @Column({ type: "timestamp", nullable: true, name: "created_date" })
    createdDate!: Date | null;

    @Column({ type: "timestamp", name: "modified_date" })
    modifiedDate!: Date;

    @Column({ type: "timestamp", nullable: true })
    lastCrawled!: Date | null;

    @Column("int", { array: true })
    userIds!: number[];

    @Column()
    readCount!: number;

    @OneToMany(() => CuriusUser, (user) => user.link, { lazy: true })
    users!: Promise<CuriusUser[]>;

    @OneToMany("CuriusComment", "link", { lazy: true })
    comments!: Promise<CuriusComment[]>;

    @OneToMany(() => CuriusHighlight, (highlight) => highlight.link, {
        lazy: true,
    })
    highlights!: Promise<CuriusHighlight[]>;
}
