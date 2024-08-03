import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { CuriusLink } from "./CuriusLink";
import { CuriusUser } from "./CuriusUser";

@Entity({ name: "curius_comments" })
export class CuriusComment {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CuriusUser)
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

    @Column()
    createdDate!: Date;

    @Column()
    modifiedDate!: Date;

    @ManyToOne(() => CuriusLink, (link) => link.comments, { lazy: true })
    @JoinColumn({ name: "link_id" })
    link!: Promise<CuriusLink>;
}
