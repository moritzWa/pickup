import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    Relation,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../User";
import { Token } from "./Token";

@Entity({
    name: "votes",
})
@Unique("votes_token_user_idx", ["tokenId", "userId"])
export class Vote {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "uuid",
        name: "token_id",
    })
    tokenId!: string;

    @ManyToOne(() => Token, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "token_id" })
    token!: Relation<Token>;

    @Column({
        nullable: true,
        type: "uuid",
        name: "user_id",
    })
    userId!: string;

    // this makes it so even if user unvotes and then votes again, their vote doesn't count as a new vote.
    @Column({
        type: "boolean",
        default: false,
        name: "is_undone",
    })
    isUndone!: boolean;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt!: Date;
}
