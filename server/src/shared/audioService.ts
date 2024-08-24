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
import { Firebase, Logger } from "src/utils";
import { PassThrough } from "stream";
import { promisify } from "util";
import _ = require("lodash");
import internal = require("stream");
import { chunkText } from "src/modules/content/services/utils";

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
    buffers: Buffer[],
    fileOutputName: string
): Promise<AudioUrlResult> {
    return new Promise<AudioUrlResult>((resolve) => {
        const ffmpegCommand = ffmpeg();

        console.log(`Processing ${buffers.length} audio buffers`);

        // Create temp, local input buffer files
        const tempInputFileBuffers = buffers.map((buffer, index) => {
            const tempFilePath = `./temp_input_${index}.mp3`;
            writeFileSync(tempFilePath, buffer);
            return tempFilePath;
        });

        // add input buffers to ffmpeg command
        tempInputFileBuffers.forEach((filePath, index) => {
            console.log(`Adding file ${index + 1} to FFmpeg command`);
            ffmpegCommand.input(filePath);
        });

        // Create a pass-through stream to pipe the output to Firebase
        const passThroughStream = new PassThrough();

        // Create a separate stream for duration calculation
        const durationStream = new PassThrough();

        // Stream the merged audio directly to Firebase Storage
        const fireBaseFileRef = bucket.file(fileOutputName);

        const writeStream = fireBaseFileRef.createWriteStream({
            contentType: "audio/mpeg",
        });

        // Pipe the ffmpeg output to both streams
        ffmpegCommand
            .on("error", (err) => {
                console.error("FFmpeg error:", err);
                resolve(failure(new UnexpectedError(err)));
            })
            .on("end", async () => {
                console.log("Files have been merged and streamed successfully");
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
            .mergeToFile(passThroughStream, "./temp")
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
                console.error("Error calculating audio duration:", error);
                // The original resolve will still be called, but without lengthMs
            }
        });

        ffmpegCommand
            .on("start", (commandLine) => {
                // console.log("FFmpeg process started:", commandLine);
            })
            .on("progress", (progress) => {
                // console.log("FFmpeg progress:", progress);
            });
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

    // TODO: bring this back but chunk-wise
    // const openPromptResponse = await openai.chat.completions.create([
    //     {
    //         role: "system",
    //         content:
    //             "Here is a batch of text. Clean it up and only return the cleaned up text. The text will be used to transform into audio content for a listener.",
    //     },
    //     {
    //         role: "user",
    //         content: `Text: ${_text}`,
    //     },
    // ]);

    // if (openPromptResponse.isFailure()) {
    //     return failure(openPromptResponse.error);
    // }

    // const openPrompt = openPromptResponse.value;
    // const prompt = openPrompt.choices[0].message.content;

    // if (!prompt) {
    //     return failure(new Error("Prompt was empty"));
    // }
    // const chunks = chunkText(prompt);

    const chunks = chunkText(_text);

    // log how many chunks were created
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
        buffers,
        `${contentTitleSlug}.mp3`
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
