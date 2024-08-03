import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from "typeorm";
import { CuriusUser } from "./CuriusUser";
import { CuriusLink } from "./CuriusLink";

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

    @ManyToOne(() => CuriusLink, (link) => link.comments)
    @JoinColumn({ name: "link_id" })
    link!: CuriusLink;
}
