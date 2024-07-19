// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED
// NOT USED

import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { Edge, GraphOptions } from "graphlib";
import { Dictionary, keyBy } from "lodash";
import {
    getClientFolderPath,
    getRealURLBackend,
    S3_FOLDERS,
} from "src/shared/uploads";
import { redisPersisted } from "src/utils/cache";
import { Helpers, Slack, SlackChannel } from "src/utils";

// uses coin gecko

const CURRENT_SCHEMA = "2024-01-17";

export type DiscoveryInfo = {
    id: string;
    symbol: string;
    name: string;
    imgThumbUrl: string;
    imgSmallUrl: string;
    imgLargeUrl: string;
};

export type DiscoveryInfoArray = DiscoveryInfo[];

type CachedDiscovery = {
    schema: string;
    info: DiscoveryInfoArray;
};

const getKey = (): string => `discovery_search_cache:v1`;

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
    data: DiscoveryInfoArray
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const key = getKey();
        const toCache: CachedDiscovery = {
            schema: CURRENT_SCHEMA,
            info: data,
        };
        const cacheData = Helpers.maybeStringifyJSON(toCache);
        if (cacheData.isFailure()) return failure(cacheData.error);
        const setResponse = await redisPersisted.set(key, cacheData.value);
        return success(null);
    } catch (e) {
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};

export const DiscoverySearchCacheService = {
    CURRENT_SCHEMA,
    getKey,
    fetch,
    wipe,
    set,
};
