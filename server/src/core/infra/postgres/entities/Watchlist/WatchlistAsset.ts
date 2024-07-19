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
import { AccountProvider, TransactionType } from "../types";

@Entity({
    name: "watchlist_assets",
})
@Unique("watchlist_asset_provider_address_idx", [
    "provider",
    "contractAddress",
    "userId",
])
@Index("watchlist_asset_user_id_index", ["userId"])
export class WatchlistAsset {
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
