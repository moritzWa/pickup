import axios from "axios";
import { NonRetriableError, slugify } from "inngest";
import { parseBuffer } from "music-metadata";
import * as pgvector from "pgvector/pg";
import { Content, ContentChunk } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { contentChunkRepo, contentRepo } from "src/modules/content/infra";
import {
    AudioDataChunk,
    TranscribeService,
} from "src/modules/content/services/transcribeService";
import { AudioService } from "src/shared/audioService";
import { openai } from "src/utils";
import { v4 as uuidv4 } from "uuid";
import { inngest } from "../clients";
import { InngestEventName } from "../types";

const hash = require("object-hash");

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

        // const chunks = await step.run("transcribe-content", async () =>
        //     _transcribeContent(contentId)
        // );

        await step.run("embed-content", async () => _embedContent(contentId));

        await step.run("generated-audio", async () =>
            _convertToAudio(contentId)
        );

        await step.run("save-audio-duration", async () =>
            _saveAudioDuration(contentId)
        );

        await step.run("mark-content-processed", async () =>
            _markContentProcessed(contentId)
        );

        return Promise.resolve();
    }
);

export const _transcribeContent = async (
    contentId: string
): Promise<AudioDataChunk[]> => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;

    // if (!!content.content) {
    //     return [];
    // }

    if (!content.audioUrl) {
        throw new NonRetriableError("No audio URL to transcribe");
    }

    // debugger;

    // get the transcript. and then store it. don't need to chunk it
    console.time("transcribe-" + content.id);
    const transcriptResponse = await TranscribeService.transcribeAudioUrl(
        content.audioUrl
    );
    console.timeEnd("transcribe-" + content.id);

    if (transcriptResponse.isFailure()) {
        throw transcriptResponse.error;
    }

    const fullTranscript = transcriptResponse.value
        .map((t) => t.transcript)
        .join(" ");

    const updateTranscriptResponse = await contentRepo.update(content.id, {
        content: fullTranscript,
    });

    if (updateTranscriptResponse.isFailure()) {
        throw updateTranscriptResponse.error;
    }

    return transcriptResponse.value;
};

const _embedContent = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        return failure(contentResponse.error);
    }

    const content = contentResponse.value;

    if (!content.summary) {
        console.log(`[no summary for ${content.title}]`);
        return Promise.resolve();
    }
    const embeddingResponse = await openai.embeddings.create(
        `Title: ${content.title}. Summary: ${content.summary || ""}`
    );

    if (embeddingResponse.isFailure()) {
        throw embeddingResponse.error;
    }

    const embedding = embeddingResponse.value;

    await contentRepo.update(content.id, {
        embedding: pgvector.toSql(embedding),
    });

    return content.id;
};

export const _embedContentIntoChunks = async (
    contentId: string,
    chunks: AudioDataChunk[]
) => {
    const contentResponse = await contentRepo.findById(contentId, {
        relations: {
            chunks: true,
        },
    });

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;

    const allChunks: ContentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingResponse = await openai.embeddings.create(
            chunk.transcript
        );

        if (embeddingResponse.isFailure()) {
            throw embeddingResponse.error;
        }

        const embedding = embeddingResponse.value;
        const idempotency = hash({ contentId, chunk });

        const contentChunk: ContentChunk = {
            id: uuidv4(),
            idempotency,
            chunkIndex: i,
            audioUrl: chunk.firebaseUrl,
            startTimeMs: Math.floor(chunk.start * 1_000),
            endTimeMs: Math.floor(chunk.end * 1_000),
            transcript: chunk.transcript,
            embedding: pgvector.toSql(embedding),
            content,
            contentId: content.id,
        };

        allChunks.push(contentChunk);
    }

    const deleteResponse = await contentChunkRepo.deleteByContent(content.id);

    if (deleteResponse.isFailure()) {
        throw deleteResponse.error;
    }

    const insertResponse = await contentChunkRepo.insert(allChunks);

    if (insertResponse.isFailure()) {
        throw insertResponse.error;
    }

    return Promise.resolve();
};

export const _saveAudioDuration = async (contentId: string) => {
    const contentResponse = await contentRepo.findById(contentId);

    if (contentResponse.isFailure()) {
        throw contentResponse.error;
    }

    const content = contentResponse.value;

    if (!content.audioUrl) {
        return Promise.resolve();
    }

    if (content.lengthMs && content.lengthMs > 0) {
        return Promise.resolve();
    }

    const response = await _updateAudioDuration(content);

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
        return Promise.resolve();
    }

    // FIXME: need to test this
    const audioResponse = await AudioService.generate(
        content.content || "",
        content.title || ""
    );

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

export const _updateAudioDuration = async (
    content: Pick<Content, "id" | "audioUrl">
): Promise<FailureOrSuccess<DefaultErrors, Content | null>> => {
    try {
        // get the audio length

        if (!content.audioUrl) {
            return success(null);
        }

        const response = await axios.get(content.audioUrl, {
            responseType: "arraybuffer",
        });

        const buffer = Buffer.from(response.data);

        // Parse the audio metadata
        const metadata = await parseBuffer(buffer, "audio/mpeg");
        const durationMS = Math.ceil((metadata.format.duration ?? 0) * 1_000);

        return await contentRepo.update(content.id, {
            lengthMs: durationMS,
        });
    } catch (err) {
        // debugger;
        return failure(new UnexpectedError(err));
    }
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
