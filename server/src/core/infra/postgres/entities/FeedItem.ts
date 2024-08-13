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
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "src/core/infra/postgres/entities/User";
import { Content } from "./Content";

@Entity({
    name: "feed_items",
})
@Unique(["userId", "contentId", "position"])
// index for user and ascending position
@Index("feed_item_user_position_idx", ["userId", "position"])
// index for user and descending created at
@Index("feed_item_user_created_at_idx", ["userId", "createdAt"])
export class FeedItem {
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
        name: "is_queued",
        type: "boolean",
        default: false,
    })
    isQueued!: boolean;

    @Column({
        nullable: false,
        name: "is_archived",
        type: "boolean",
        default: false,
    })
    isArchived!: boolean;

    @Column({
        nullable: false,
        name: "user_id",
    })
    @Index("feed_items_user_id_idx")
    userId!: string;

    @Column({
        nullable: false,
        name: "content_id",
    })
    @Index("feed_items_content_id_idx")
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

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt!: Date;
}
