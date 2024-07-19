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
import { AccountProvider } from "src/core/infra/postgres/entities";

const CURRENT_SCHEMA = "2024-02-08";
const getKey = ({
    provider,
    contractAddress,
}: {
    provider: AccountProvider;
    contractAddress: string;
}): string => `token_metadata_cache:v1:${provider}:${contractAddress}}`;

type CachedTokenMetadataData = {
    provider: AccountProvider;
    contractAddress: string;
    symbol: string;
    name: string;
    iconImageUrl: string;
};

type CachedTokenMetadata = {
    schema: string;
    data: CachedTokenMetadataData;
};

const fetch = async ({
    provider,
    contractAddress,
}: {
    provider: AccountProvider;
    contractAddress: string;
}): Promise<FailureOrSuccess<DefaultErrors, Maybe<CachedTokenMetadata>>> => {
    try {
        const key = getKey({ provider, contractAddress });
        const result = await redisPersisted.get(key);
        if (!result) return success(null);
        const parseResult = Helpers.maybeParseJSON<CachedTokenMetadata>(result);
        if (parseResult.isFailure() || !parseResult.value)
            // might need to check parseResult.value.data, idk
            return failure(
                new Error(
                    "Could not parse token metadata cache for key: " + key
                )
            );

        if (parseResult.value.schema !== CURRENT_SCHEMA) {
            await wipe({ provider, contractAddress }); // wipe old discovery
            return success(null);
        }

        return success(parseResult.value as CachedTokenMetadata);
    } catch (e) {
        // does not exist or could not parse
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};

const wipe = async ({
    provider,
    contractAddress,
}: {
    provider: AccountProvider;
    contractAddress: string;
}): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const key = getKey({ provider, contractAddress });
        const del = await redisPersisted.del(key);
        return success(null);
    } catch (e) {
        // does not exist or could not parse
        console.error(e);
        return failure(new UnexpectedError(e));
    }
};

// see scripts for how we set cache
const set = async ({
    provider,
    contractAddress,
    data,
}: {
    provider: AccountProvider;
    contractAddress: string;
    data: CachedTokenMetadataData;
}): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const key = getKey({ provider, contractAddress });
        const toCache: CachedTokenMetadata = {
            schema: CURRENT_SCHEMA,
            data,
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

export const TokenMetadataCacheService = {
    CURRENT_SCHEMA,
    getKey,
    fetch,
    wipe,
    set,
};
