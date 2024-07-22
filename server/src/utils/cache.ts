import IORedis, { Redis } from "ioredis";
import { config } from "src/config";
import { failure, success } from "src/core/logic";

// LRU cache for recalc speedup
// just having it fallback to cache for now if url isn't set
export const redisPersisted = new IORedis(config.redis.persistedRedisUrl);

redisPersisted.on("error", (err) => {
    console.log("=====ERROR WITH PERSISTED REDIS====");
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
