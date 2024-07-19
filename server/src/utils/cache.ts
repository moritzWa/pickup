import IORedis, { Redis } from "ioredis";
import { config } from "src/config";
import { failure, success } from "src/core/logic";

// LRU cache for recalc speedup
// just having it fallback to cache for now if url isn't set
export const redisRecalculateSpeedup = new IORedis(
    config.redis.recalculateSpeedupRedisUrl || config.redis.cacheRedisUrl
);
export const redisPersisted = new IORedis(config.redis.persistedRedisUrl);
export const redisHistoricalPricing = new IORedis(
    config.redis.historicalPricingRedisUrl
);
export const redisImports = new IORedis(config.redis.importsRedisUrl);
export const redisWrapped = new IORedis(config.redis.wrappedRedisUrl);

redisPersisted.on("error", (err) => {
    console.log("=====ERROR WITH PERSISTED REDIS====");
    console.error(err);
});

redisImports.on("error", (err) => {
    console.log("=====ERROR WITH IMPORTS REDIS====");
    console.error(err);
});

redisHistoricalPricing.on("error", (err) => {
    console.log("=====ERROR WITH HISTORICAL PRICING REDIS====");
    console.error(err);
});

redisWrapped.on("error", (err) => {
    console.log("=====ERROR WITH WRAPPED REDIS====");
    console.error(err);
});

redisRecalculateSpeedup.on("error", (err) => {
    console.log("=====ERROR WITH RECALCULATE SPEEDUP REDIS====");
    console.error(err);
});

export const setRedis = async (redis: Redis, key: string, value: string) => {
    try {
        await redis.set(key, value);
        return success(null);
    } catch (err) {
        console.error(err);
        return failure(err);
    }
};
