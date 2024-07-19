import { FlowProducer, FlowJob, FlowOpts, JobNode } from "bullmq";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import IORedis from "ioredis";
import { config } from "src/config";

const connection = new IORedis(config.redis.persistedRedisUrl, {
    maxRetriesPerRequest: null,
});

const flowProducer = new FlowProducer({ connection });

const createFlow = async (
    flow: FlowJob,
    opts?: FlowOpts
): Promise<FailureOrSuccess<DefaultErrors, JobNode>> => {
    try {
        return success(await flowProducer.add(flow, opts));
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const FlowJobService = { create: createFlow, client: flowProducer };

export { FlowJob, FlowOpts };
