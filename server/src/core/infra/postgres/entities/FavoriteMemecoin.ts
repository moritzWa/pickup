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
import { User } from "./User";
import { AccountProvider } from "./types";

@Entity({
    name: "favorite_memecoins",
})
@Unique("favorite_memecoins_token_idx", [
    "provider",
    "contractAddress",
    "userId",
])
@Index("favorite_memecoins_user_idx", ["userId"])
export class FavoriteMemecoin {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "provider",
    })
    provider!: AccountProvider;

    @Column({
        nullable: false,
        type: "text",
        name: "contract_address",
    })
    contractAddress!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "icon_image_url",
    })
    iconImageUrl!: Maybe<string>;

    @Column({
        nullable: false,
        type: "text",
        name: "symbol",
    })
    symbol!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "name",
    })
    name!: string;

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
