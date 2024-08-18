import ffmpeg from "fluent-ffmpeg";
import { unlinkSync, writeFileSync } from "fs";
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
import _ = require("lodash");
import internal = require("stream");

const bucket = Firebase.storage().bucket();

function bufferToStream(buffer: Buffer): internal.Readable {
    const readable = new internal.Readable();
    readable.push(buffer);
    readable.push(null); // Signal the end of the stream
    return readable;
}

type AudioUrlResult = FailureOrSuccess<DefaultErrors, { url: string }>;

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

        // Stream the merged audio directly to Firebase Storage
        const fireBaseFileRef = bucket.file(fileOutputName);

        const writeStream = fireBaseFileRef.createWriteStream({
            contentType: "audio/mpeg",
        });

        // Pipe the ffmpeg output to the pass-through stream
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
                resolve(success({ url }));
            })
            .mergeToFile(passThroughStream, "./temp")
            .format("mp3");

        // Pipe the pass-through stream to the Firebase write stream
        passThroughStream.pipe(writeStream);

        ffmpegCommand
            .on("start", (commandLine) => {
                console.log("FFmpeg process started:", commandLine);
            })
            .on("progress", (progress) => {
                console.log("FFmpeg progress:", progress);
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

const MAX_CHUNK_SIZE = 4000;

function chunkText(text: string): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    for (let sentence of sentences) {
        sentence = sentence.trim();
        if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE) {
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence + " ";
        } else {
            currentChunk += sentence + " ";
        }
    }

    // Push the last chunk if it exists
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

const toSpeech = async (
    _text: string,
    rawContentTitle: string
): Promise<FailureOrSuccess<DefaultErrors, { url: string }>> => {
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
    });
};

export const AudioService = {
    stitch: stitchAndStreamAudioFiles,
    generate: (text: string, rawContentTitle: string) =>
        toSpeech(text, rawContentTitle),
};
