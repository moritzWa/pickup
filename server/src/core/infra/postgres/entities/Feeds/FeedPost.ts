import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Relation,
    Unique,
    Index,
} from "typeorm";
import { User } from "../User";
import { AccountProvider } from "../types";
import { Token } from "../Token";

@Entity({
    name: "feed_posts",
})
// not just for one coin
// @Index("feed_posts_contract_address_provider_idx", [
//     "contractAddress",
//     "provider",
// ])
export class FeedPost {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "uuid",
        name: "user_id",
    })
    userId!: string;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

    @Column({
        nullable: false,
        default: "",
        type: "text",
        name: "content",
    })
    content!: string;

    @Column({
        nullable: false,
        default: 0,
        type: "integer",
        name: "num_likes",
    })
    numLikes!: number;

    @Column({
        nullable: false,
        default: 0,
        type: "integer",
        name: "num_comments",
    })
    numComments!: number;

    @Column({
        nullable: false,
        type: "uuid",
        name: "token_id",
    })
    @Index()
    tokenId!: string;

    @ManyToOne(() => Token, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "token_id" })
    token!: Relation<User>;

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
