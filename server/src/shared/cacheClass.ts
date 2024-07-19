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

type CachedTokenSecurity<TData> = {
    schema: string;
    data: TData;
};

// NOT USED ANYWHERE
export default class Cache<TData> {
    public CURRENT_SCHEMA: string;
    public CACHE_TTL_SECONDS: string;
    public NAMESPACE: string;
    public getKey: () => string;

    constructor({
        currentSchema,
        cacheTtlSeconds,
        namespace,
        getKey,
    }: {
        currentSchema: string;
        cacheTtlSeconds: string;
        namespace: string;
        getKey: () => string;
    }) {
        this.CURRENT_SCHEMA = currentSchema;
        this.CACHE_TTL_SECONDS = cacheTtlSeconds;
        this.NAMESPACE = namespace;
        this.getKey = getKey;
    }

    // getKey = (): string => this.NAMESPACE;

    fetch = async <TData>(): Promise<
        FailureOrSuccess<DefaultErrors, Maybe<CachedTokenSecurity<TData>>>
    > => {
        try {
            const key = this.getKey();
            const result = await redisPersisted.get(key);
            if (!result) return success(null);
            const parseResult =
                Helpers.maybeParseJSON<CachedTokenSecurity<TData>>(result);
            if (parseResult.isFailure() || !parseResult.value)
                // might need to check parseResult.value.data, idk
                return failure(
                    new Error("Could not parse wrapped cache for key: " + key)
                );

            if (parseResult.value.schema !== this.CURRENT_SCHEMA) {
                await this.wipe(); // wipe old discovery
                return success(null);
            }

            return success(parseResult.value as CachedTokenSecurity<TData>);
        } catch (e) {
            // does not exist or could not parse
            console.error(e);
            return failure(new UnexpectedError(e));
        }
    };

    wipe = async (): Promise<FailureOrSuccess<DefaultErrors, null>> => {
        try {
            const key = this.getKey();
            const del = await redisPersisted.del(key);
            return success(null);
        } catch (e) {
            // does not exist or could not parse
            console.error(e);
            return failure(new UnexpectedError(e));
        }
    };

    // see scripts for how we set cache
    set = async <TData>(
        data: TData
    ): Promise<FailureOrSuccess<DefaultErrors, null>> => {
        try {
            const key = this.getKey();
            const toCache: CachedTokenSecurity<TData> = {
                schema: this.CURRENT_SCHEMA,
                data,
            };
            const cacheData = Helpers.maybeStringifyJSON(toCache);
            if (cacheData.isFailure()) return failure(cacheData.error);
            const setResponse = await redisPersisted.set(
                key,
                cacheData.value,
                "EX",
                this.CACHE_TTL_SECONDS
            );
            return success(null);
        } catch (e) {
            console.error(e);
            return failure(new UnexpectedError(e));
        }
    };
}
