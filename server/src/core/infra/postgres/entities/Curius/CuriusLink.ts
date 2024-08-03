import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CuriusComment } from "./CuriusComment";
import { CuriusHighlight } from "./CuriusHighlight";
import { CuriusUser } from "./CuriusUser";

@Entity({ name: "curius_links" })
export class CuriusLink {
    @PrimaryGeneratedColumn()
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

    @Column({ nullable: true })
    createdDate!: Date | null;

    @Column()
    modifiedDate!: Date;

    @Column({ nullable: true })
    lastCrawled!: Date | null;

    @Column("int", { array: true })
    userIds!: number[];

    @Column()
    readCount!: number;

    @OneToMany(() => CuriusUser, (user) => user.link)
    users!: CuriusUser[];

    @OneToMany(() => CuriusComment, (comment) => comment.link)
    comments!: CuriusComment[];

    @OneToMany(() => CuriusHighlight, (highlight) => highlight.link)
    highlights!: CuriusHighlight[];
}
