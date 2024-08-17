import ffmpeg from "fluent-ffmpeg";
import { unlinkSync, writeFileSync } from "fs";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { Firebase, openai } from "src/utils";
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

function chunkText(text: string): string[] {
    const maxChunkSize = 4000;
    const chunks: string[] = [];
    let currentChunk = "";

    const words = text.split(" ");

    for (let word of words) {
        if ((currentChunk + word).length > maxChunkSize) {
            chunks.push(currentChunk.trim());
            currentChunk = word + " ";
        } else {
            currentChunk += word + " ";
        }
    }

    // Push the last chunk if it exists
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

const toSpeech = async (
    _text: string
): Promise<FailureOrSuccess<DefaultErrors, { url: string }>> => {
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

    const responses: FailureOrSuccess<DefaultErrors, Buffer>[] = [];

    for (const chunk of chunks) {
        const response = await openai.audio.speak({
            text: chunk,
            voice: "onyx",
            model: "tts-1",
        });

        if (response instanceof Buffer) {
            responses.push(success(response));
        } else {
            return failure(new UnexpectedError("Failed to generate audio"));
        }
    }

    const failures = responses.filter((r) => r.isFailure());

    if (failures.length > 0) {
        return failure(failures[0].error);
    }

    const buffers = responses.map((r) => r.value);

    const audioFileResponse = await stitchAndStreamAudioFiles(
        buffers,
        "audio.mp3"
    );

    if (audioFileResponse.isFailure()) {
        return failure(audioFileResponse.error);
    }

    const audioFile = audioFileResponse.value;

    return success({
        url: audioFile.url,
    });
};

export const AudioService = {
    stitch: stitchAndStreamAudioFiles,
    generate: toSpeech,
};
