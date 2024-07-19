import { Maybe } from "src/core/logic";
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { AccountProvider } from "./types";

@Entity({
    name: "blacklist_tokens",
})
@Index(
    "blacklist_token_contract_address_provider_idx",
    ["contractAddress", "provider"],
    {
        unique: true,
    }
)
export class BlacklistToken {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "provider",
    })
    @Index("blacklist_token_provider_idx")
    provider!: AccountProvider;

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
        type: "text",
        name: "contract_address",
    })
    contractAddress!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "icon_image_url",
    })
    iconImageUrl!: string;

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
