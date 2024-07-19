import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    JoinColumn,
    ManyToOne,
    Relation,
    Index,
    Unique,
    OneToMany,
} from "typeorm";
import { CategorySlug, Category as CategoryName, Token } from "./Token";

@Entity({
    name: "competitions",
})
export class Competition {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "name",
    })
    name!: string;

    @Column({
        nullable: false,
        type: "uuid",
        name: "token1_id",
    })
    token1Id!: string;

    @ManyToOne(() => Token, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "token1_id" })
    token1!: Relation<Token>;

    @Column({
        nullable: false,
        type: "uuid",
        name: "token2_id",
    })
    token2Id!: string;

    @ManyToOne(() => Token, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "token2_id" })
    token2!: Relation<Token>;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "created_at",
        default: () => "NOW()",
    })
    createdAt!: Date;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "updated_at",
        default: () => "NOW()",
    })
    updatedAt!: Date;
}
