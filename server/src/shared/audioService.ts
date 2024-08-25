import crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import { unlinkSync, writeFileSync } from "fs";
import mp3Duration from "mp3-duration";
import OpenAI from "openai";
import { performance } from "perf_hooks";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { chunkText } from "src/modules/content/services/utils";
import { Firebase, Logger } from "src/utils";
import { PassThrough } from "stream";
import { promisify } from "util";
import _ = require("lodash");
import internal = require("stream");

const bucket = Firebase.storage().bucket();

function bufferToStream(buffer: Buffer): internal.Readable {
    const readable = new internal.Readable();
    readable.push(buffer);
    readable.push(null); // Signal the end of the stream
    return readable;
}

type AudioUrlResult = FailureOrSuccess<
    DefaultErrors,
    { url: string; lengthMs: number | null }
>;

const mp3DurationPromise = promisify(mp3Duration);

async function stitchAndStreamAudioFiles(
    contentTitleSlug: string,
    buffers: Buffer[]
): Promise<AudioUrlResult> {
    return new Promise<AudioUrlResult>((resolve) => {
        const ffmpegCommand = ffmpeg();

        Logger.info(`Processing ${buffers.length} audio buffers`);

        // Create temp, local input buffer files with unique names
        const tempInputFileBuffers = buffers.map((buffer, index) => {
            const uniqueId = crypto.randomBytes(4).toString("hex");
            const tempFilePath = `./temp_input_${index}_${contentTitleSlug}_${uniqueId}.mp3`;
            writeFileSync(tempFilePath, buffer);
            return tempFilePath;
        });

        // add input buffers to ffmpeg command
        tempInputFileBuffers.forEach((filePath, index) => {
            Logger.info(`Adding file ${index + 1} to FFmpeg command`);
            ffmpegCommand.input(filePath);
        });

        // Create a pass-through stream to pipe the output to Firebase
        const passThroughStream = new PassThrough();

        // Create a separate stream for duration calculation
        const durationStream = new PassThrough();

        // Stream the merged audio directly to Firebase Storage
        const outputFileName = `${contentTitleSlug}.mp3`;
        const fireBaseFileRef = bucket.file(outputFileName);

        const writeStream = fireBaseFileRef.createWriteStream({
            contentType: "audio/mpeg",
        });

        // Pipe the ffmpeg output to both streams
        ffmpegCommand
            .on("error", (err) => {
                Logger.error(
                    `FFmpeg error: ${JSON.stringify(
                        err,
                        Object.getOwnPropertyNames(err)
                    )}`
                );
                resolve(failure(new UnexpectedError(err)));
            })
            .on("end", async () => {
                Logger.info("Files have been merged and streamed successfully");
                const [url] = await fireBaseFileRef.getSignedUrl({
                    action: "read",
                    expires: "03-01-2500",
                });

                // Clean up temporary files
                tempInputFileBuffers.forEach((filePath) =>
                    unlinkSync(filePath)
                );
                resolve(success({ url, lengthMs: null })); // We'll update this later
            })
            .mergeToFile(passThroughStream, "./temp") // dir for ffmpeg to store intermediate files
            .format("mp3");

        // Pipe the pass-through stream to both Firebase and duration calculation
        passThroughStream.pipe(writeStream);
        passThroughStream.pipe(durationStream);

        // Calculate duration
        let chunks: Buffer[] = [];
        durationStream.on("data", (chunk) => chunks.push(chunk));
        durationStream.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            try {
                const durationInSeconds = await mp3DurationPromise(buffer);
                const lengthMs = Math.round(durationInSeconds * 1000);
                resolve(
                    success({
                        url: (
                            await fireBaseFileRef.getSignedUrl({
                                action: "read",
                                expires: "03-01-2500",
                            })
                        )[0],
                        lengthMs,
                    })
                );
            } catch (error) {
                Logger.error(
                    `Error calculating audio duration: ${JSON.stringify(error)}`
                );
                // The original resolve will still be called, but without lengthMs
            }
        });

        ffmpegCommand
            .on("start", (commandLine) => {})
            .on("progress", (progress) => {});
    });
}

const slugify = (str: string) => {
    str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space
    str = str.toLowerCase(); // convert string to lowercase
    str = str
        .replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/-+/g, "-"); // remove consecutive hyphens
    return str;
};

const toSpeech = async (
    _text: string,
    rawContentTitle: string
): Promise<
    FailureOrSuccess<DefaultErrors, { url: string; lengthMs: number | null }>
> => {
    const startTime = performance.now();
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const chunks = chunkText(_text);

    Logger.info(`chunks: ${chunks.length}`);

    const buffers: Buffer[] = [];

    const ttsStartTime = performance.now();
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            const chunkStartTime = performance.now();
            const response = await openai.audio.speech.create({
                model: "tts-1",
                voice: "onyx",
                input: chunk,
            });

            const buffer = Buffer.from(await response.arrayBuffer());
            buffers.push(buffer);
            const chunkEndTime = performance.now();
            Logger.info(
                `Processed chunk ${i + 1}/${chunks.length} in ${Math.round(
                    chunkEndTime - chunkStartTime
                )}ms`
            );
        } catch (error: unknown) {
            console.error("OpenAI API error:", error);
            if (error instanceof Error) {
                return failure(
                    new UnexpectedError(`OpenAI API error: ${error.message}`)
                );
            } else {
                return failure(
                    new UnexpectedError(
                        `OpenAI API error: Unknown error occurred`
                    )
                );
            }
        }
    }
    const ttsEndTime = performance.now();
    Logger.info(
        `TTS processing took ${Math.round(ttsEndTime - ttsStartTime)}ms for ${
            chunks.length
        } chunks.`
    );

    if (buffers.length === 0) {
        return failure(new UnexpectedError("No audio buffers were generated"));
    }

    const contentTitleSlug = slugify(rawContentTitle);
    const stitchingStartTime = performance.now();
    const audioFileResponse = await stitchAndStreamAudioFiles(
        contentTitleSlug,
        buffers
    );
    const stitchingEndTime = performance.now();
    Logger.info(
        `Audio stitching took ${Math.round(
            stitchingEndTime - stitchingStartTime
        )}ms`
    );

    if (audioFileResponse.isFailure()) {
        return failure(audioFileResponse.error);
    }

    const audioFile = audioFileResponse.value;

    const endTime = performance.now();
    Logger.info(
        `Total toSpeech processing time: ${Math.round(endTime - startTime)}ms`
    );

    return success({
        url: audioFile.url,
        lengthMs: audioFile.lengthMs,
    });
};

export const AudioService = {
    stitch: stitchAndStreamAudioFiles,
    generate: (text: string, rawContentTitle: string) =>
        toSpeech(text, rawContentTitle),
};
