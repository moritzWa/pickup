import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { CuriusComment } from "./CuriusComment";
import { CuriusHighlight } from "./CuriusHighlight";
import { CuriusUser } from "./CuriusUser";

@Entity({ name: "curius_links" })
export class CuriusLink {
    @PrimaryColumn()
    id!: number;

    @Column()
    link!: string;

    @Column()
    title!: string;

    @Column()
    favorite!: boolean;

    @Column()
    snippet!: string;

    @Column({ type: "jsonb", nullable: true })
    metadata?: {
        full_text?: string;
        author?: string;
        page_type?: string;
    };

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

    @OneToMany(() => CuriusComment, (comment) => comment.link, { lazy: true })
    comments!: Promise<CuriusComment[]>;

    @OneToMany(() => CuriusHighlight, (highlight) => highlight.link, {
        lazy: true,
    })
    highlights!: Promise<CuriusHighlight[]>;
}
