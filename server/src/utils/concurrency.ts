import { config } from "src/config";
import { Semaphore, withTimeout } from "async-mutex";

const maxConcurrentJobs = Number(config.concurrency.maxConcurrency);
const maxWaitTime = Number(config.concurrency.maxWaitTime);
const concurrencyError = new Error(
    "timed out waiting for concurrency lock - need to requeue"
);

export const processConcurrency = withTimeout(
    new Semaphore(maxConcurrentJobs),
    maxWaitTime,
    concurrencyError
);

export const withConcurrentLimitOrTimeout = async (jobName = "", fn) => {
    if (processConcurrency.isLocked()) {
        console.info(
            `${jobName} process_concurrency pid(${
                process.pid
            }): process is too busy, heap( ${Math.round(
                process.memoryUsage().heapUsed / 1024 / 1024
            )} MB ), ${
                maxConcurrentJobs - processConcurrency.getValue()
            } jobs currently running -  waiting at most ${maxWaitTime} ms`
        );
        logMemoryUsage("waiting");
    } else {
        console.debug(
            `${jobName} process_concurrency pid(${
                process.pid
            }): process is not too busy, ${
                maxConcurrentJobs - processConcurrency.getValue()
            } jobs running`
        );
    }

    const [_, release] = await processConcurrency.acquire();

    try {
        console.debug(
            `${jobName} process_concurrency pid(${
                process.pid
            }):  acquired lock, ${
                maxConcurrentJobs - processConcurrency.getValue()
            } jobs running`
        );
        logMemoryUsage(`${jobName} before work`);
        await fn();
    } finally {
        release();
        logMemoryUsage(`${jobName} after work`);
    }
};

export const withConcurrentLimitOrTimeoutV2 = async <
    FunctionT extends (...args: any) => any
>(
    jobName = "",
    fn: FunctionT
): Promise<ReturnType<FunctionT>> => {
    if (processConcurrency.isLocked()) {
        console.info(
            `${jobName} 
            process_concurrency pid(${
                process.pid
            }): process is too busy, heap( ${Math.round(
                process.memoryUsage().heapUsed / 1024 / 1024
            )} MB ), ${
                maxConcurrentJobs - processConcurrency.getValue()
            } jobs currently running -  waiting at most ${maxWaitTime} ms`
        );
        logMemoryUsage("waiting");
    } else {
        console.debug(
            `${jobName} process_concurrency pid(${
                process.pid
            }): process is not too busy, ${
                maxConcurrentJobs - processConcurrency.getValue()
            } jobs running`
        );
    }

    const [_, release] = await processConcurrency.acquire();

    try {
        console.debug(
            `${jobName} process_concurrency pid(${
                process.pid
            }):  acquired lock, ${
                maxConcurrentJobs - processConcurrency.getValue()
            } jobs running`
        );
        logMemoryUsage(`${jobName} before work`);
        const res = await fn();
        return res;
    } finally {
        release();
        logMemoryUsage(`${jobName} after work`);
    }
};

export const logMemoryUsage = (prefix: String) => {
    const memoryUsed = process.memoryUsage();
    for (let key in memoryUsed) {
        console.log(
            `${prefix} Memory: ${key} ${(memoryUsed[key] / 1024 / 1024).toFixed(
                2
            )} MB`
        );
    }
};
