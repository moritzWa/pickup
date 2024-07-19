import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { redisPersisted } from "src/utils/cache";
import { Helpers } from "src/utils";
import {
    NexusGenEnums,
    NexusGenRootTypes,
} from "src/core/surfaces/graphql/generated/nexus";
import { Category } from "src/core/infra/postgres/entities/Token";
import { DiscoveryResultType } from "src/modules/discovery/graphql";
import { AccountProvider } from "src/core/infra/postgres/entities";
import BigNumber from "bignumber.js";

const CURRENT_SCHEMA = "2024-06-02";
const CACHE_TTL_SECONDS = 60 * 10; // 10 mins

export type CategoriesCacheData = {
    bannerImageUrl?: string | null; // String
    categoryName: string; // String!
    description: string; // String!
    iconImageUrl?: string | null; // String
    slug: string; // String!
    tokens: {
        id: string; // String!
        coinGeckoTokenId?: string | null; // String
        contractAddress: string; // String!
        iconImageUrl: string; // String!
        isDead?: boolean | null; // Boolean
        isClaimed?: boolean | null; // Boolean
        isStrict?: boolean | null; // Boolean
        isMovementVerified?: boolean | null; // Boolean
        marketCap?: string | null; // String
        name: string; // String!
        priceChangePercentage24h?: number | null; // Float
        priceChangePercentage24hFormatted?: string | null; // String
        priceFormatted?: string | null; // String
        provider: "solana";
        symbol: string; // String!
        type: "FungibleToken" | "NFT";
        vol24h?: string | null; // String
    }[]; // [DiscoverySplashResult!]!
    totalMarketCap: BigNumber | null; // Float
    totalMarketCapChange: BigNumber | null; // Float
    totalMarketCapChangePercentage: BigNumber | null; // Float
    totalVol24h: BigNumber | null; // Float
    type: Category; // CategoryEnum!
};

type CachedCategory = {
    schema: string;
    data: CategoriesCacheData;
};

const getKey = (category: Category): string =>
    `categories_cache:${category.toString().toLowerCase()}:v1`;

const fetch = async (
    category: Category
): Promise<FailureOrSuccess<DefaultErrors, Maybe<CachedCategory>>> => {
    try {
        const key = getKey(category);
        const result = await redisPersisted.get(key);
        if (!result) return success(null);
        const parseResult = Helpers.maybeParseJSON<CachedCategory>(result);
        if (parseResult.isFailure() || !parseResult.value)
            // might need to check parseResult.value.data, idk
            return failure(
                new Error("Could not parse wrapped cache for key: " + key)
            );

        if (parseResult.value.schema !== CURRENT_SCHEMA) {
            await wipe(category); // wipe old discovery
            return success(null);
        }
        const parsed = parseResult.value;

        const respWithBN: CachedCategory = {
            schema: parsed.schema,
            data: {
                ...parsed.data,
                totalMarketCap:
                    parsed.data.totalMarketCap !== null
                        ? new BigNumber(parsed.data.totalMarketCap)
                        : null,
                totalMarketCapChange:
                    parsed.data.totalMarketCapChange !== null
                        ? new BigNumber(parsed.data.totalMarketCapChange)
                        : null,
                totalMarketCapChangePercentage:
                    parsed.data.totalMarketCapChangePercentage !== null
                        ? new BigNumber(
                              parsed.data.totalMarketCapChangePercentage
                          )
                        : null,
                totalVol24h:
                    parsed.data.totalVol24h !== null
                        ? new BigNumber(parsed.data.totalVol24h)
                        : null,
                tokens: parsed.data.tokens.map((t) => ({
                    ...t,
                    marketCap: t.marketCap,
                    vol24h: t.vol24h,
                })),
            },
        };

        return success(respWithBN as CachedCategory);
    } catch (e) {
        // does not exist or could not parse
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};

const exists = async (
    category: Category
): Promise<FailureOrSuccess<DefaultErrors, boolean>> => {
    try {
        const key = getKey(category);
        const result = await redisPersisted.get(key);
        if (!result) return success(false);
        const parseResult = Helpers.maybeParseJSON<CachedCategory>(result);
        if (parseResult.isFailure() || !parseResult.value)
            // might need to check parseResult.value.data, idk
            return failure(
                new Error("Could not parse wrapped cache for key: " + key)
            );
        if (parseResult.value.schema !== CURRENT_SCHEMA) {
            await wipe(category); // wipe old discovery
            return success(false);
        }
        return success(true);
    } catch (e) {
        // does not exist or could not parse
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};

const wipe = async (
    category: Category
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const key = getKey(category);
        const del = await redisPersisted.del(key);
        return success(null);
    } catch (e) {
        // does not exist or could not parse
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};

// see scripts for how we set cache
const set = async (
    category: Category,
    data: CategoriesCacheData
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const key = getKey(category);
        const toCache: CachedCategory = {
            schema: CURRENT_SCHEMA,
            data,
        };
        const cacheData = Helpers.maybeStringifyJSON(toCache);
        if (cacheData.isFailure()) return failure(cacheData.error);
        const setResponse = await redisPersisted.set(
            key,
            cacheData.value,
            "EX",
            CACHE_TTL_SECONDS
        );
        return success(null);
    } catch (e) {
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};

export const CategoriesCacheService = {
    CURRENT_SCHEMA,
    getKey,
    exists,
    fetch,
    wipe,
    set,
};
