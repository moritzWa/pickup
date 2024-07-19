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
import { FeedComment } from "./FeedComment";

@Entity({
    name: "feed_likes",
})
@Unique("feed_likes_id_user_id_idx", ["id", "feedPostId"])
export class FeedLike {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // must have feed post id OR feed comment id
    @Column({
        nullable: true,
        type: "uuid",
        name: "feed_post_id",
    })
    @Index("feed_likes_feed_post_id_idx")
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
    @Index("feed_likes_feed_comment_id_idx")
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
