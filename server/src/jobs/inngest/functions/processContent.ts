import { Tags } from "hot-shots";
import { DefaultErrors, failure, FailureOrSuccess } from "src/core/logic";
import { Datadog, openai } from "src/utils";
import { inngest } from "../clients";
import { InngestEventName } from "../types";
import { NonRetriableError, slugify } from "inngest";
import { contentRepo } from "src/modules/content/infra";
import { AudioService } from "src/shared/audioService";
import axios from "axios";
import { parseBuffer, parseFile } from "music-metadata";

const NAME = "Process Content";
const CONCURRENCY = 50;
const RETRIES = 3;

const processContent = inngest.createFunction(
    {
        name: NAME,
        id: slugify(NAME),
        concurrency: CONCURRENCY,
        retries: RETRIES,
    },
    { event: InngestEventName.ProcessContent },
    async ({ event, step }) => {
        const contentId = event.data.contentId;

        await step.run("check-if-already-processed", async () =>
            _checkIfProcessed(contentId)
        );

        await step.run("embed-content", async () => _embedContent(contentId));

        await step.run("audio-content", async () => _convertToAudio(contentId));

        await step.run("mark-content-processed", async () =>
            _markContentProcessed(contentId)
        );

        return Promise.resolve();
    }
);

const _checkIfProcessed = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;

    if (content.isProcessed) {
        throw new NonRetriableError("Content is already processed.");
    }

    return Promise.resolve();
};

const _embedContent = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;
    const query = content.summary;

    if (content.embedding) {
        return Promise.resolve();
    }

    if (!query) {
        throw new NonRetriableError(
            "Cannot retry bc the content has no summary"
        );
    }

    const embeddingResponse = await openai.embeddings.create(query);

    if (embeddingResponse.isFailure()) {
        throw embeddingResponse.error;
    }

    const embedding = embeddingResponse.value;

    const contentUpdateResponse = await contentRepo.update(content.id, {
        embedding: embedding,
    });

    if (contentUpdateResponse.isFailure()) {
        throw contentUpdateResponse.error;
    }

    return Promise.resolve();
};

const _convertToAudio = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;

    if (content.audioUrl) {
        if (!content.lengthMs) {
            // get the audio length
            const response = await axios.get(content.audioUrl, {
                responseType: "arraybuffer",
            });

            const buffer = Buffer.from(response.data);

            // Parse the audio metadata
            const metadata = await parseBuffer(buffer, "audio/mpeg");
            const durationMS = (metadata.format.duration ?? 0) * 1_000;

            await contentRepo.update(content.id, {
                lengthMs: durationMS,
            });
        }

        return Promise.resolve();
    }

    const audioResponse = await AudioService.generate(content.context);

    if (audioResponse.isFailure()) {
        throw audioResponse.error;
    }

    const audio = audioResponse.value;

    const contentUpdateResponse = await contentRepo.update(content.id, {
        audioUrl: audio.url,
    });

    if (contentUpdateResponse.isFailure()) {
        throw contentUpdateResponse.error;
    }

    return Promise.resolve();
};

const _markContentProcessed = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;

    const updateResponse = await contentRepo.update(content.id, {
        isProcessed: true,
    });

    if (updateResponse.isFailure()) {
        throw updateResponse.error;
    }

    return Promise.resolve();
};

export { processContent };
