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
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

const CURRENT_SCHEMA = "2024-02-07";
const CACHE_TTL_SECONDS = 60 * 60; // 1 hr

type DiscoveryJupiterTokensCacheData = {
    coinGeckoTokenId?: string | null;
    contractAddress: string;
    iconImageUrl?: string | null;
    name: string;
    priceChangePercentage24h?: number | null;
    priceChangePercentage24hFormatted?: string | null;
    priceFormatted?: string | null;
    provider: NexusGenEnums["AccountProviderEnum"];
    symbol: string;
    type: NexusGenEnums["DiscoveryResultTypeEnum"];
    isStrict: boolean; // need this for discovery sorting
    index: number;
}[];

type CachedDiscovery = {
    schema: string;
    data: DiscoveryJupiterTokensCacheData;
};

const getKey = (): string => `discovery_jupiter_tokens_cache:v1`;

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

        return success(parseResult.value as CachedDiscovery);
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
    data: DiscoveryJupiterTokensCacheData
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

export const DiscoveryJupiterTokensCacheService = {
    CURRENT_SCHEMA,
    getKey,
    fetch,
    wipe,
    set,
};
