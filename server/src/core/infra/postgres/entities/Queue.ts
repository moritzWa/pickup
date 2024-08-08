import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Relation,
    Unique,
} from "typeorm";
import { User } from "src/core/infra/postgres/entities/User";
import { Content } from "./Content";

@Entity({
    name: "queue",
})
export class Queue {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // position
    @Column({
        nullable: false,
        name: "position",
        type: "float",
    })
    position!: number;

    @Column({
        nullable: false,
        name: "user_id",
    })
    @Index("user_id_idx")
    userId!: string;

    @Column({
        nullable: false,
        name: "content_id",
    })
    @Index("content_id_idx")
    contentId!: string;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

    @ManyToOne(() => Content, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "content_id" })
    content!: Relation<Content>;
}
