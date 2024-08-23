import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "src/config";
import { contentRepo } from "src/modules/content/infra";
import { AudioService } from "src/shared/audioService";
import { Logger } from "src/utils";

const connection = new IORedis(config.redis.persistedRedisUrl, {
    maxRetriesPerRequest: null,
});

const audioGenerationQueue = new Queue("audioGeneration", {
    connection,
});

const audioGenerationWorker = new Worker(
    "audioGeneration",
    async (job) => {
        const { contentId, text, title } = job.data;

        Logger.info(`Generating audio for contentId: ${title}`);

        try {
            const audioResponse = await AudioService.generate(text, title);
            if (audioResponse.isFailure()) {
                throw audioResponse.error;
            }

            const { url, lengthMs } = audioResponse.value;

            // Update content with audio URL and length
            await contentRepo.update(contentId, {
                audioUrl: url,
                lengthMs,
            });

            Logger.info(
                `Audio generated and content updated for title: ${title}. Find audio at ${url}`
            );
        } catch (error) {
            Logger.error(
                `Failed to generate audio for contentId: ${contentId}`,
                error
            );
        }
    },
    {
        connection,
    }
);

export { audioGenerationQueue as AudioGenerationQueue };
