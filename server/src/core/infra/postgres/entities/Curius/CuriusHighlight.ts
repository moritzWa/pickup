import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryColumn,
} from "typeorm";
import { CuriusComment } from "./CuriusComment";
import { CuriusLink } from "./CuriusLink";
import { CuriusMention } from "./CuriusMention";
import { CuriusUser } from "./CuriusUser";

@Entity({ name: "curius_highlights" })
export class CuriusHighlight {
    @PrimaryColumn()
    id!: number;

    @ManyToOne(() => CuriusUser)
    @JoinColumn({ name: "user_id" })
    user!: CuriusUser;

    @Column()
    userId!: number;

    @ManyToOne(() => CuriusLink, (link) => link.highlights, { lazy: true })
    @JoinColumn({ name: "link_id" })
    link!: Promise<CuriusLink>;

    @Column()
    linkId!: number;

    @Column()
    highlight!: string;

    @Column()
    createdDate!: Date;

    @Column({ type: "jsonb", nullable: true })
    position!: any;

    @Column({ nullable: true })
    verified?: boolean;

    @Column()
    leftContext!: string;

    @Column()
    rightContext!: string;

    @Column()
    rawHighlight!: string;

    @OneToOne(() => CuriusComment, { nullable: true })
    @JoinColumn({ name: "comment_id" })
    comment?: CuriusComment;

    @OneToMany(() => CuriusMention, (mention) => mention.highlight)
    mentions!: CuriusMention[];
}
