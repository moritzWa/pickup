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

    /* 

"title": "Thunder (mascot)",
  "content": "... <p><b>Thunder</b> is the <a href=\"https://en.wikipedia.org/wiki/Stage_name\">stage name</a> for the...",
  "author": "Wikipedia Contributors",
  "date_published": "2016-09-16T20:56:00.000Z",
  "lead_image_url": null,
  "dek": null,
  "next_page_url": null,
  "url": "https://en.wikipedia.org/wiki/Thunder_(mascot)",
  "domain": "en.wikipedia.org",
  "excerpt": "Thunder Thunder is the stage name for the horse who is the official live animal mascot for the Denver Broncos",
  "word_count": 4677,
  "direction": "ltr",
  "total_pages": 1,
  "rendered_pages": 1

*/

    @Column({ type: "jsonb", nullable: true })
    metadata?: {
        full_text?: string;
        author?: string;
        page_type?: string;

        // postlight/parser stuff
        content?: string;
        title?: string;
        date_published?: string;
        lead_image_url?: string;
        dek?: string;
        next_page_url?: string;
        domain?: string;
        excerpt?: string;
        word_count?: number;
        direction?: string;
        total_pages?: number;
        rendered_pages?: number;
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
