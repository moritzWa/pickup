import { CoinGeckoTokenId } from "src/utils/coingecko/types";
import { PricingCache } from "./pricingCache";
import IORedis from "ioredis";
import { config } from "src/config";
import { parallel } from "radash";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";

export const pricingRedisCache = new IORedis(config.redis.persistedRedisUrl, {
    maxRetriesPerRequest: null,
});

class CryptoPriceService {
    private pricingServices: Record<string, PricingCache> = {};
    private pricingRedisCache: IORedis = pricingRedisCache;

    // register the default price services
    constructor() {}

    getNumber = () => Object.keys(this.pricingServices).length;

    getByteSizeOfPricingServices = () => {
        try {
            const size = Object.values(this.pricingServices).reduce(
                (acc, curr) => acc + (curr.getByteSize() ?? 0),
                0
            );
            return size;
        } catch (err) {
            return 0;
        }
    };

    private upsertPricingService = (tokenId: string, cache: PricingCache) => {
        const services = { ...this.pricingServices };
        services[tokenId] = cache;
        return services;
    };

    /**
     * Takes a coingecko ID, and if there is already a price service return it,
     * otherwise instantiate a pricing cache with that token, load it with data, add it to the
     * cache and then return it.
     *
     * In the future, maybe should just store this in redis or something
     */
    getPricingService = async (
        _tokenId: string
    ): Promise<FailureOrSuccess<DefaultErrors, PricingCache>> => {
        try {
            const tokenId = _tokenId;
            const tokenPricingCache = this.pricingServices[tokenId];

            if (tokenPricingCache && tokenPricingCache.isWarmed()) {
                return success(tokenPricingCache);
            }

            const newCache = new PricingCache(
                tokenId,
                1000,
                this.pricingRedisCache
            );

            // refresh the data in the new service
            await newCache.warm();

            const newPricingService = this.upsertPricingService(
                tokenId,
                newCache
            );

            this.pricingServices = newPricingService;

            return success(newCache);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    // hard refresh the caches (by calling coingecko)
    refreshAll = async () =>
        await parallel(2, Object.values(this.pricingServices), (s) =>
            s.refresh(true)
        );
}

// export a singleton
export const cryptoPriceService = new CryptoPriceService();
