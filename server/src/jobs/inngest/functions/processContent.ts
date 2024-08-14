import { Tags } from "hot-shots";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
} from "src/core/logic";
import { Datadog, openai } from "src/utils";
import { inngest } from "../clients";
import { InngestEventName } from "../types";
import { NonRetriableError, slugify } from "inngest";
import { contentChunkRepo, contentRepo } from "src/modules/content/infra";
import { AudioService } from "src/shared/audioService";
import axios from "axios";
import { TranscribeService } from "src/modules/content/services/transcribeService";
import { ContentService } from "src/modules/content/services/contentService";
import { ContentChunk } from "src/core/infra/postgres/entities";
import { v4 as uuidv4 } from "uuid";
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

        await step.run("transcribe-content", async () =>
            _transcribeContent(contentId)
        );

        await step.run("embed-content", async () => _embedContent(contentId));

        await step.run("generated-audio", async () =>
            _convertToAudio(contentId)
        );

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

export const _transcribeContent = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;

    if (!content.content) {
        return Promise.resolve();
    }

    if (!content.audioUrl) {
        throw new NonRetriableError("No audio URL to transcribe");
    }

    // debugger;

    // get the transcript. and then store it. don't need to chunk it
    const transcriptResponse = await TranscribeService.transcribeAudioUrl(
        content.audioUrl
    );

    if (transcriptResponse.isFailure()) {
        throw transcriptResponse.error;
    }

    const transcript = transcriptResponse.value;

    const updateTranscriptResponse = await contentRepo.update(content.id, {
        content: transcript,
    });

    if (updateTranscriptResponse.isFailure()) {
        throw updateTranscriptResponse.error;
    }

    return Promise.resolve();
};

export const _embedContent = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;
    const fullContent = content.content;

    const chunks = ContentService.chunkContent(fullContent || "");

    const allChunks: ContentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingResponse = await openai.embeddings.create(chunk);

        if (embeddingResponse.isFailure()) {
            throw embeddingResponse.error;
        }

        const embedding = embeddingResponse.value;

        const contentChunk: ContentChunk = {
            id: uuidv4(),
            chunkIndex: i,
            transcript: chunk,
            embedding,
            content,
            contentId: content.id,
        };

        allChunks.push(contentChunk);
    }

    const response = await contentChunkRepo.insert(allChunks);

    if (response.isFailure()) {
        throw response.error;
    }

    return Promise.resolve();
};

export const _convertToAudio = async (contentId: string) => {
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

export const _markContentProcessed = async (contentId: string) => {
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
