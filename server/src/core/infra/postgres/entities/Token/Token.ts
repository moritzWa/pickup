import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    success,
} from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    ManyToMany,
    JoinTable,
    OneToMany,
    Unique,
} from "typeorm";
import { AccountProvider, AssetType } from "../types";
import { CategoryEntry } from ".";
import { config } from "src/config";

export enum BlacklistReason {
    NotMeme = "not_meme",
    Duplicate = "duplicate", // the token is a copycat of an existing token
    Failure = "failure", // the token failed (e.g. it is dead, it is a failed project)
    Racist = "racist", // e.g. andrew tate's token
}

export enum IsFreezeableEnum {
    Yes = "yes",
    No = "no",
    Inconclusive = "inconclusive",
}

export enum IsDeadStatus {
    Dead = "dead",
    Alive = "alive",
    Inconclusive = "inconclusive",
}

export enum MemecoinLinkType {
    Twitter = "twitter",
    Telegram = "telegram",
    Website = "website",
    Solscan = "solscan",
    Discord = "discord",
    Coingecko = "coingecko",
    Medium = "medium",
    DexScreener = "dexscreener",
    DexTools = "dextools",
    Instagram = "instagram",
    Reddit = "reddit",
    TikTok = "tiktok",
    YouTube = "youtube",
    Email = "email",
    Birdeye = "birdeye",
    Raydium = "raydium",
    Jupiter = "jupiter",
    CoinGeckoDEX = "coingecko_dex",
    Spotify = "spotify",
}

export type MemecoinLink = {
    type: MemecoinLinkType;
    url: string;
    alwaysShow?: boolean;
};

export const MemecoinLinkTypeValues = Object.values(MemecoinLinkType);

export const getTokenThumbnailIconImageUrl = (t: Token) => {
    if (!t) return "";

    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${config.firebase.storageBucket}`;

    // if we uploaded a URL specifically, always use that one for now
    if (t.iconImageUrl.includes(baseUrl)) return t.iconImageUrl;

    // otherwise use CDN and fall back to the uploaded icon image URL
    return t.cdnThumbnailImageUrl || t.iconImageUrl;
};

export const linkStarts: Record<
    (typeof MemecoinLinkTypeValues)[number],
    Maybe<string[]>
> = {
    [MemecoinLinkType.Twitter]: [
        "https://twitter.com/",
        "https://www.twitter.com/",
        "https://x.com/",
    ],
    [MemecoinLinkType.Telegram]: ["https://t.me/"],
    [MemecoinLinkType.Website]: ["https://", "http://"],
    [MemecoinLinkType.Solscan]: ["https://solscan.io/"],
    [MemecoinLinkType.Discord]: ["https://discord.gg/"],
    [MemecoinLinkType.Coingecko]: ["https://www.coingecko.com/"],
    [MemecoinLinkType.Medium]: ["https://medium.com/"],
    [MemecoinLinkType.DexScreener]: ["https://dexscreener.com/"],
    [MemecoinLinkType.DexTools]: ["https://www.dextools.io/"],
    [MemecoinLinkType.Instagram]: ["https://www.instagram.com/"],
    [MemecoinLinkType.Reddit]: ["https://www.reddit.com/"],
    [MemecoinLinkType.TikTok]: ["https://www.tiktok.com/"],
    [MemecoinLinkType.YouTube]: ["https://www.youtube.com/"],
    [MemecoinLinkType.Email]: null,
    [MemecoinLinkType.Birdeye]: ["https://birdeye.so/"],
    [MemecoinLinkType.Raydium]: ["https://raydium.io/"],
    [MemecoinLinkType.Jupiter]: ["https://jup.ag/"],
    [MemecoinLinkType.CoinGeckoDEX]: ["https://www.geckoterminal.com/"],
    [MemecoinLinkType.Spotify]: ["https://open.spotify.com/"],
};

export const validateLink = (
    link: MemecoinLink
): FailureOrSuccess<DefaultErrors, null> => {
    if (!link.url) {
        return failure(new Error("Link URL is required"));
    }
    if (linkStarts[link.type] === null) return success(null);
    if (
        linkStarts[link.type] === undefined ||
        linkStarts[link.type]!.every((start) => !link.url.startsWith(start))
    ) {
        return failure(
            new Error(
                `Invalid link for ${
                    link.type
                }. Make sure it starts with ${linkStarts[link.type]!.join(
                    ", "
                )}`
            )
        );
    }

    return success(null);
};

@Entity({
    name: "tokens",
})
@Index("token_contract_address_provider_idx", ["contractAddress", "provider"], {
    unique: true,
})
@Index("token_coingecko_id_provider_idx", ["coingeckoId", "provider"], {
    unique: true,
})
export class Token {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "provider",
    })
    @Index("token_provider_idx")
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
        nullable: true,
        type: "text",
        name: "coingecko_id",
    })
    @Index("token_coingecko_id_idx")
    coingeckoId!: Maybe<string>;

    @Column({
        nullable: false,
        type: "text",
        name: "contract_address",
    })
    contractAddress!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "best_lp_pool_address",
    })
    bestLpPoolAddress!: string | null;

    @Column({
        nullable: false,
        type: "text",
        name: "icon_image_url",
    })
    iconImageUrl!: string;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "has_added_to_cdn",
    })
    hasAddedToCdn!: boolean;

    @Column({
        nullable: true,
        type: "text",
        name: "cdn_thumbnail_image_url",
    })
    cdnThumbnailImageUrl!: string | null;

    @Column({
        nullable: true,
        type: "text",
        name: "cdn_hero_image_url",
    })
    cdnHeroImageUrl!: string | null;

    @Column({
        nullable: true,
        type: "text",
        name: "cdn_original_image_url",
    })
    cdnOriginalImageUrl!: string | null;

    @Column({
        nullable: true,
        type: "text",
        name: "twitter_link",
    })
    twitterLink!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "website_link",
    })
    websiteLink!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "telegram_link",
    })
    telegramLink!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        default: null,
        name: "slug",
    })
    @Index("token_slug_idx", { unique: true })
    slug!: Maybe<string>;

    @Column({
        nullable: false,
        type: "jsonb",
        name: "more_links",
        default: "[]",
    })
    moreLinks!: MemecoinLink[];

    @Column({
        nullable: true,
        type: "text",
        name: "description",
    })
    description!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "banner_url",
    })
    bannerUrl!: Maybe<string>;

    @Column({
        nullable: true,
        type: "numeric",
        name: "vol24h",
    })
    vol24h!: Maybe<number>;

    // must divide by 1000 because regular integers are too large
    @Column({
        nullable: true,
        type: "numeric",
        name: "fdv",
    })
    fdv!: Maybe<number>;

    @Column({
        nullable: true,
        type: "text",
        name: "fdv_updated_at_unix_str",
    })
    fdvUpdatedAtUnixStr!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "irl_name",
    })
    irlName!: Maybe<string>;

    // null if we haven't checked yet, true if fdv does not exist, undefined in backfill
    @Column({
        nullable: true,
        type: "boolean",
        default: false,
        name: "fdv_dne",
    })
    fdvDNE!: Maybe<boolean>;

    @Column({
        nullable: true,
        type: "text",
        name: "token_created_at_unix_str",
    })
    tokenCreatedAtUnixStr!: Maybe<string>;

    // null if we haven't checked yet, true if token created at does not exist, undefined in backfill
    @Column({
        nullable: true,
        type: "boolean",
        default: false,
        name: "token_created_at_dne",
    })
    tokenCreatedAtDNE!: Maybe<boolean>;

    @OneToMany(() => CategoryEntry, (t) => t.token, {
        nullable: true,
    })
    categories!: CategoryEntry[];

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_strict",
    })
    isStrict!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_movement_verified",
    })
    isMovementVerified!: boolean;

    @Column({
        nullable: false,
        type: "boolean",
        default: false,
        name: "is_claimed",
    })
    isClaimed!: boolean;

    @Column({
        nullable: true,
        type: "boolean",
        default: null,
        name: "is_dead",
    })
    isDead!: Maybe<boolean>;

    @Column({
        nullable: true,
        type: "enum",
        default: null,
        enum: IsDeadStatus,
        enumName: "is_dead_enum",
        name: "is_dead_enum",
    })
    isDeadEnum!: Maybe<IsDeadStatus>;

    @Column({
        nullable: true,
        type: "enum",
        default: null,
        enum: IsFreezeableEnum,
        enumName: "is_freezeable_enum",
        name: "is_freezeable",
    })
    isFreezeable!: Maybe<IsFreezeableEnum>;

    @Column({
        nullable: true,
        type: "enum",
        default: null,
        enum: BlacklistReason,
        enumName: "blacklist_reason",
        name: "is_blacklisted",
    })
    isBlacklisted!: Maybe<BlacklistReason>;

    @Column({
        nullable: false,
        default: 0,
        type: "numeric",
        name: "num_votes",
    })
    numVotes!: number;

    // @Column({
    //     nullable: true,
    //     type: "text",
    //     name: "last_checked_is_dead_unix_str",
    // })
    // lastCheckedIsDeadUnixStr!: Maybe<string>;

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
