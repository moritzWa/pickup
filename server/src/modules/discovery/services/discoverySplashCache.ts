import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { Edge, GraphOptions } from "graphlib";
import { Dictionary, isNil, keyBy } from "lodash";
import {
    getClientFolderPath,
    getRealURLBackend,
    S3_FOLDERS,
} from "src/shared/uploads";
import { redisPersisted } from "src/utils/cache";
import { Helpers, Slack, SlackChannel } from "src/utils";
import {
    NexusGenEnums,
    NexusGenObjects,
    NexusGenRootTypes,
} from "src/core/surfaces/graphql/generated/nexus";
import { CategoriesCacheData } from "src/modules/categories/services/categoryService/categoriesCacheService";
import BigNumber from "bignumber.js";
import { FullCompetition } from "src/modules/competitions/services/competitionService/FullCompetition";

const CURRENT_SCHEMA = "2024-05-30";
const CACHE_TTL_SECONDS = 60 * 10; // 10 mins

type TokenCacheData = {
    id: string;
    coinGeckoTokenId?: string | null;
    contractAddress: string;
    iconImageUrl: string;
    name: string;
    priceChangePercentage24h?: number | null;
    priceChangePercentage24hFormatted?: string | null;
    priceFormatted?: string | null;
    provider: NexusGenEnums["AccountProviderEnum"];
    symbol: string;
    type: NexusGenEnums["DiscoveryResultTypeEnum"];
};

type DiscoverySplashCacheData = {
    results: TokenCacheData[]; // trending
    blueChips: TokenCacheData[];
    categories: CategoriesCacheData[];
    competitions: FullCompetition[];
};

type CachedDiscovery = {
    schema: string;
    data: DiscoverySplashCacheData;
};

const getKey = (): string => `discovery_splash_cache:v1`;

const fetch = async (): Promise<
    FailureOrSuccess<DefaultErrors, Maybe<CachedDiscovery>>
> => {
    try {
        const key = getKey();
        const result = await redisPersisted.get(key);
        if (!result) return success(null);
        const parseResult = Helpers.maybeParseJSON<CachedDiscovery>(result);
        if (parseResult.isFailure() || !parseResult.value)
            // might need to check parseResult.value.data, idk
            return failure(
                new Error("Could not parse wrapped cache for key: " + key)
            );

        if (parseResult.value.schema !== CURRENT_SCHEMA) {
            await wipe(); // wipe old discovery
            return success(null);
        }

        const data = parseResult.value.data;

        const value: DiscoverySplashCacheData = {
            results: data.results,
            blueChips: data.blueChips,
            categories: data.categories.map((c) => ({
                ...c,
                totalMarketCap: !isNil(c.totalMarketCap)
                    ? new BigNumber(c.totalMarketCap)
                    : null,
                totalVol24h: !isNil(c.totalVol24h)
                    ? new BigNumber(c.totalVol24h)
                    : null,
                totalMarketCapChange: !isNil(c.totalMarketCapChange)
                    ? new BigNumber(c.totalMarketCapChange)
                    : null,
                totalMarketCapChangePercentage: !isNil(
                    c.totalMarketCapChangePercentage
                )
                    ? new BigNumber(c.totalMarketCapChangePercentage)
                    : null,
            })),
            competitions: data.competitions,
        };

        const response: CachedDiscovery = {
            schema: parseResult.value.schema,
            data: value,
        };
        return success(response);
    } catch (e) {
        // does not exist or could not parse
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};

const wipe = async (): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const key = getKey();
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
    data: DiscoverySplashCacheData
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const key = getKey();
        const toCache: CachedDiscovery = {
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

export const DiscoverySplashCacheService = {
    CURRENT_SCHEMA,
    getKey,
    fetch,
    wipe,
    set,
};
