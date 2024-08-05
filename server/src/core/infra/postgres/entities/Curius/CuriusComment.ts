import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "typeorm";
import type { CuriusLink } from "./CuriusLink";
import { CuriusUser } from "./CuriusUser";

@Entity({ name: "curius_comments" })
export class CuriusComment {
    @PrimaryColumn()
    id!: number;

    @ManyToOne(() => CuriusUser, { eager: true })
    @JoinColumn({ name: "user_id" })
    user!: CuriusUser;

    @Column()
    userId!: number;

    @Column({ nullable: true })
    parentId?: number;

    @ManyToOne(() => CuriusComment, (comment) => comment.replies, {
        nullable: true,
    })
    @JoinColumn({ name: "parent_id" })
    parent?: CuriusComment;

    @OneToMany(() => CuriusComment, (comment) => comment.parent)
    replies?: CuriusComment[];

    @Column()
    text!: string;

    @Column({ name: "created_date" })
    createdDate!: Date;

    @Column({ name: "modified_date" })
    modifiedDate!: Date;

    @ManyToOne("CuriusLink", "comments", { lazy: true })
    @JoinColumn({ name: "link_id" })
    link!: Promise<CuriusLink>;
}
