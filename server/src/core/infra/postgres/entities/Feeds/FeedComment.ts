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
import { FeedPost } from "./FeedPost";

@Entity({
    name: "feed_comments",
})
export class FeedComment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // must have feed post id OR feed comment id
    @Column({
        nullable: true,
        type: "uuid",
        name: "feed_post_id",
    })
    @Index("feed_comments_feed_post_id_idx")
    feedPostId!: Maybe<string>;

    @ManyToOne(() => FeedPost, (t) => t.id, {
        nullable: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "feed_post_id" })
    feedPost!: Relation<Maybe<FeedPost>>;

    @Column({
        nullable: true,
        type: "uuid",
        name: "feed_comment_id",
    })
    @Index("feed_comments_feed_comment_id_idx")
    feedCommentId!: Maybe<string>;

    @ManyToOne(() => FeedComment, (t) => t.id, {
        nullable: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "feed_comment_id" })
    feedComment!: Relation<Maybe<FeedComment>>;

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
