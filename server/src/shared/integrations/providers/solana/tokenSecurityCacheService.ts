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

const CURRENT_SCHEMA = "2024-02-02";
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hrs
const getKey = ({
    provider,
    contractAddress,
}: {
    provider: string;
    contractAddress: string;
}): string => `token_security_cache:v1:${provider}:${contractAddress}}`;

type CachedTokenSecurityData = {
    // data: {
    creatorAddress: string | null;
    ownerAddress: string | null;
    creationTx: string | null;
    creationTime: string | null;
    creationSlot: string | null;
    mintTx: string | null;
    mintTime: string | null;
    mintSlot: string | null;
    creatorBalance: number | null;
    ownerBalance: number | null;
    ownerPercentage: number | null;
    creatorPercentage: number | null;
    metaplexUpdateAuthority: string;
    metaplexUpdateAuthorityBalance: number;
    metaplexUpdateAuthorityPercent: number;
    mutableMetadata: boolean;
    top10HolderBalance: number;
    top10HolderPercent: number;
    top10UserBalance: number;
    top10UserPercent: number;
    isTrueToken: boolean | null;
    totalSupply: number;
    preMarketHolder: any[]; // Replace 'any' with a more specific type if possible
    lockInfo: any | null; // Replace 'any' with a more specific type if possible
    freezeable: boolean | null;
    freezeAuthority: string | null;
    transferFeeEnable: boolean | null;
    transferFeeData: any | null; // Replace 'any' with a more specific type if possible
    isToken2022: boolean;
    nonTransferable: boolean | null;
    // };
    // success: boolean;
    // statusCode: number;
};

type CachedTokenSecurity = {
    schema: string;
    data: CachedTokenSecurityData;
};

const fetch = async ({
    provider,
    contractAddress,
}: {
    provider: string;
    contractAddress: string;
}): Promise<FailureOrSuccess<DefaultErrors, Maybe<CachedTokenSecurity>>> => {
    try {
        const key = getKey({ provider, contractAddress });
        const result = await redisPersisted.get(key);
        if (!result) return success(null);
        const parseResult = Helpers.maybeParseJSON<CachedTokenSecurity>(result);
        if (parseResult.isFailure() || !parseResult.value)
            // might need to check parseResult.value.data, idk
            return failure(
                new Error("Could not parse wrapped cache for key: " + key)
            );

        if (parseResult.value.schema !== CURRENT_SCHEMA) {
            await wipe({ provider, contractAddress }); // wipe old discovery
            return success(null);
        }

        return success(parseResult.value as CachedTokenSecurity);
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
    provider: string;
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
    provider: string;
    contractAddress: string;
    data: CachedTokenSecurityData;
}): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    try {
        const key = getKey({ provider, contractAddress });
        const toCache: CachedTokenSecurity = {
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

export const TokenSecurityCacheService = {
    CURRENT_SCHEMA,
    getKey,
    fetch,
    wipe,
    set,
};
