import {
    Queue as BullQueue,
    QueueOptions,
    Job,
    JobsOptions,
    Worker,
    WorkerOptions,
} from "bullmq";
import IORedis from "ioredis";

import { config } from "src/config";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    NotFoundError,
    success,
    UnexpectedError,
} from "src/core/logic";
import { IWorker } from "./worker";
import { parseRedisUrl } from "src/utils/redis";

const redisUrl = config.redis.persistedRedisUrl;

const parsedUrlParts = parseRedisUrl(redisUrl);
const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// there is 2 for every queue + 1 for the cron
// so this silences the warning for up to 12 different workers + 1 cron (per process of the node server running)
connection.setMaxListeners(50);

class Queue<T> {
    private _queue: BullQueue;
    private _worker: Maybe<Worker>;
    private _name: string;

    get name() {
        return this._name;
    }

    get queue() {
        return this._queue;
    }

    constructor(queueName: string, options?: QueueOptions) {
        const bullQueue: BullQueue = new BullQueue(queueName, {
            ...options,
            connection: connection,
        });

        this._name = bullQueue.name;
        this._queue = bullQueue;
        this._worker = null;
    }

    getJob = async (jobId: string): Promise<Job<T> | null> => {
        const job = await this.queue.getJob(jobId);
        return job || null;
    };

    getFailedCount = async (): Promise<number> => {
        return this.queue.getFailedCount();
    };

    getFailed = async (): Promise<Job<any, any, string>[]> => {
        return this.queue.getFailed(0, 5);
    };

    addWorkerClass = async (
        worker: IWorker<T>,
        opts?: WorkerOptions,
        onCompletedListener?: (
            job: Job<any, any, string> | undefined,
            result: any,
            prev: string
        ) => void,
        onFailedListener?: (
            job: Job<any, any, string> | undefined,
            result: any,
            prev: string
        ) => void
    ): Promise<Maybe<Worker<T>>> => {
        if (!this._queue) {
            return null;
        }

        console.info(`[ADDED WORKER FOR ${this._name}]`);

        const bullWorker = new Worker(
            this._queue.name,
            async (job, token) => worker.process(job, token),
            { connection, ...opts }
        );

        if (onCompletedListener) {
            bullWorker.on("completed", onCompletedListener);
        }

        if (onFailedListener) {
            bullWorker.on("failed", onFailedListener);
        }

        this._worker = bullWorker;

        process.on("SIGINT", async () => {
            console.info(`[killed worker ${this._name}]`);
            await bullWorker.close();
        });

        return bullWorker;
    };

    addWorkerProcessorFile = async (
        file: string,
        opts?: WorkerOptions,
        onCompletedListener?: (
            job: Job<any, any, string> | undefined,
            result: any,
            prev: string
        ) => void,
        onFailedListener?: (
            job: Job<any, any, string> | undefined,
            result: any,
            prev: string
        ) => void
    ): Promise<Maybe<Worker<T>>> => {
        if (!this._queue) {
            return null;
        }

        console.info(`[ADDED WORKER FOR ${this._name}]`);

        const bullWorker = new Worker(this._queue.name, file, {
            connection,
            // useWorkerThreads: true, FIXME: breaks stuff atm
            ...opts,
        });

        if (onCompletedListener) {
            bullWorker.on("completed", onCompletedListener);
        }

        if (onFailedListener) {
            bullWorker.on("failed", onFailedListener);
        }

        process.on("SIGINT", async () => {
            console.info(`[killed worker ${this._name}]`);
            await bullWorker.close();
        });

        this._worker = bullWorker;

        return bullWorker;
    };

    kill = async () => {
        if (!this._queue) {
            return;
        }

        if (!this._worker) {
            return;
        }

        // console.info(`[KILLED WORKER FOR ${this._name}]`);

        await this._worker.close();

        this._worker = null;
    };

    enqueue = async (
        data: T,
        options?: JobsOptions
    ): Promise<FailureOrSuccess<DefaultErrors, Job<T>>> => {
        try {
            if (!this._queue) {
                return failure(new Error("No queue instantiated."));
            }

            const result = await this._queue.add(
                `${this._queue.name}-job`,
                data,
                options
            );

            console.info(`[JOB ADDED TO ${this._name} QUEUE]`);

            return success(result);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };

    bulkEnqueue = async (
        data: T[],
        options?: JobsOptions
    ): Promise<FailureOrSuccess<DefaultErrors, Job<T>[]>> => {
        try {
            if (!this._queue) {
                return failure(new Error("No queue instantiated."));
            }

            const result = await this._queue.addBulk(
                data.map((d, i) => ({
                    name: `${this._queue.name}-${i}-job`,
                    data: d,
                    opts: options,
                }))
            );

            console.info(`[BULK JOBS ADDED TO ${this._name} QUEUE]`);

            return success(result);
        } catch (err) {
            return failure(new UnexpectedError(err));
        }
    };
}

export default Queue;
