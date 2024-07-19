import Redlock, {
    ExecutionError,
    ExecutionResult,
    Lock,
    Settings,
} from "redlock-temp-fix";
import IORedis from "ioredis";
import { config } from "src/config";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    success,
    UnexpectedError,
} from "src/core/logic";
import * as schedule from "node-schedule";
import { Slack, SlackChannel } from "./slack";
import { sleep } from "radash";

const redisUrl = config.redis.persistedRedisUrl;

// Note: if we change this, also look at the client lock service to change as well
// bc that uses this connection to check for lock
export const redlockConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// TODO: use redis cluster
export const redlock = new Redlock(
    [redlockConnection, redlockConnection, redlockConnection],
    {
        // The expected clock drift; for more details see:
        // http://redis.io/topics/distlock
        driftFactor: 0.01, // multiplied by lock ttl to determine drift time

        // The max number of times Redlock will attempt to lock a resource
        // before erroring.
        retryCount: 10,

        // the time in ms between attempts
        retryDelay: 200, // time in ms

        // the max time in ms randomly added to retries
        // to improve performance under high contention
        // see https://www.awsarchitectureblog.com/2015/03/backoff.html
        retryJitter: 200, // time in ms

        // The minimum remaining time on a lock before an extension is automatically
        // attempted with the `using` API.
        automaticExtensionThreshold: 500, // time in ms
    }
);

export const getRedlock = (settings?: Partial<Settings>) =>
    new Redlock([redlockConnection], {
        // The expected clock drift; for more details see:
        // http://redis.io/topics/distlock
        driftFactor: 0.01, // multiplied by lock ttl to determine drift time

        // The max number of times Redlock will attempt to lock a resource
        // before erroring.
        retryCount: 3,

        // the time in ms between attempts
        retryDelay: 200, // time in ms

        // the max time in ms randomly added to retries
        // to improve performance under high contention
        // see https://www.awsarchitectureblog.com/2015/03/backoff.html
        retryJitter: 200, // time in ms

        // The minimum remaining time on a lock before an extension is automatically
        // attempted with the `using` API.
        automaticExtensionThreshold: 500, // time in ms
        ...settings,
    });

export const acquireLock = async (
    redlock: Redlock,
    resources: string[],
    duration: number,
    settings?: Partial<Settings> | undefined
): Promise<FailureOrSuccess<DefaultErrors, Lock>> => {
    try {
        const lock = await redlock.acquire(resources, duration, settings);

        return success(lock);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const releaseLock = async (
    lock: Lock,
    settings?: Partial<Settings> | undefined
): Promise<FailureOrSuccess<DefaultErrors, ExecutionResult>> => {
    try {
        // console.log(`[releasing lock]`);

        const result = await redlock.release(lock, settings);

        return success(result);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const extendLock = async (
    lock: Lock,
    ttl: number,
    settings?: Partial<Settings> | undefined
): Promise<FailureOrSuccess<DefaultErrors, Lock>> => {
    try {
        const result = await redlock.extend(lock, ttl, settings);

        return success(result);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

// there is a bug in using that makes it not usable for auto extending. waiting for fix supposedly merged in
// March 2023 but not released as a new version yet
export const useAutoExtendingLock = async (
    resource: string,
    ttl: number,
    anyFxn: () => Promise<void>
): Promise<FailureOrSuccess<DefaultErrors, null>> => {
    const refreshInterval = Math.floor(ttl * 0.5); // Refresh at least every second

    let timeout: Maybe<NodeJS.Timeout> = null;
    let lock: Maybe<Lock> = null;

    try {
        console.log(`Trying to lock ${resource} 🤖`);

        const lockResponse = await acquireLock(redlock, [resource], ttl, {
            retryCount: 3,
            retryDelay: 1000,
            retryJitter: 200,
        });

        if (lockResponse.isFailure()) {
            console.log(`Could not lock ${resource} ❌`);

            return failure(lockResponse.error);
        }

        console.log(`Successfully locked ${resource} 🔒`);

        lock = lockResponse.value;

        if (!lock) {
            return failure(new UnexpectedError("lock is null"));
        }

        // Refresh the lock and schedule the next refresh
        const constantlyExtendLock = (): void => {
            timeout = setTimeout(async () => {
                let isExpired = false;
                try {
                    // eslint-disable-next-line require-atomic-updates
                    lock = await lock!.extend(ttl);
                    console.log(
                        `Extended lock on ${resource}, refreshing in ${refreshInterval} ms 🔒`
                    );
                } catch (err) {
                    debugger;

                    if (err instanceof ExecutionError) {
                        isExpired = ((err as any)?.message || "").includes(
                            "Cannot extend an already-expired lock."
                        );

                        if (isExpired) {
                            console.log(`Lock already expired ${resource} ❌`);
                            return;
                        }
                    }

                    throw err;
                }

                if (!isExpired) {
                    constantlyExtendLock();
                }
            }, refreshInterval);
        };

        constantlyExtendLock();

        // Do some work...
        await anyFxn();

        // clean up interval + release lock
        if (timeout) clearTimeout(timeout);
        await lock.release();

        console.log(`Released the lock on ${resource} ✅`);

        return success(null);
    } catch (err) {
        // clean up on throwing an error
        if (timeout) clearTimeout(timeout);
        if (lock) await lock.release();

        console.log(`Released the lock on failure ${resource} ❌`);

        return failure(new UnexpectedError(err));
    }
};

const testRun = async () => {
    const responses = await Promise.all([
        useAutoExtendingLock("lock:test", 1000, async () => {
            await sleep(10000);

            console.log("first lock success");
        }),
        useAutoExtendingLock("lock:test", 1000, async () => {
            await sleep(10000);

            console.log("second lock success");
        }),
    ]);

    console.log("done");
};

// if it is the main module being called
if (require.main === module) {
    void testRun().finally(() => process.exit(0));
}
