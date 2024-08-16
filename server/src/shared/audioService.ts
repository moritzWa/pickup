import ffmpeg from "fluent-ffmpeg";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";
import { Firebase, firebase, openai } from "src/utils";
import { PassThrough } from "stream";
import internal = require("stream");

const bucket = Firebase.storage().bucket();

function bufferToStream(buffer: Buffer): internal.Readable {
    const readable = new internal.Readable();
    readable.push(buffer);
    readable.push(null); // Signal the end of the stream
    return readable;
}

async function stitchAndStreamAudioFiles(
    buffers: Buffer[],
    output: string
): Promise<FailureOrSuccess<DefaultErrors, { url: string }>> {
    return new Promise<FailureOrSuccess<DefaultErrors, { url: string }>>(
        (resolve) => {
            const command = ffmpeg();

            // Add each file to the command
            buffers.forEach((bf) => {
                const source = bufferToStream(bf);
                command.input(source);
            });

            // Create a pass-through stream to pipe the output to Firebase
            const passThroughStream = new PassThrough();

            // Stream the merged audio directly to Firebase Storage
            const file = bucket.file(output);

            const writeStream = file.createWriteStream({
                contentType: "audio/mpeg",
            });

            // Pipe the ffmpeg output to the pass-through stream
            command
                .on("error", (err) => {
                    resolve(failure(new UnexpectedError(err)));
                })
                .on("end", async () => {
                    console.log(
                        "Files have been merged and streamed successfully"
                    );

                    const originalUrl = `https://firebasestorage.googleapis.com/v0/b/${
                        bucket.name
                    }/o/${encodeURIComponent(output)}?alt=media`;

                    resolve(
                        success({
                            url: originalUrl,
                        })
                    );
                })
                .format("mp3") // Ensure the output format is mp3
                .pipe(passThroughStream);

            // Pipe the pass-through stream to the Firebase write stream
            passThroughStream.pipe(writeStream);
        }
    );
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
    const openPromptResponse = await openai.chat.completions.create([
        {
            role: "system",
            content:
                "Here is a batch of text. Clean it up and only return the cleaned up text. The text will be used to transform into audio content for a listener.",
        },
        {
            role: "user",
            content: `Text: ${_text}`,
        },
    ]);

    if (openPromptResponse.isFailure()) {
        return failure(openPromptResponse.error);
    }

    const openPrompt = openPromptResponse.value;
    const prompt = openPrompt.choices[0].message.content;

    if (!prompt) {
        return failure(new Error("Prompt was empty"));
    }

    const chunks = chunkText(prompt);

    const responses: FailureOrSuccess<DefaultErrors, Buffer>[] = [];

    debugger;

    for (const chunk of chunks) {
        const response = await openai.audio.speak({
            text: chunk,
            voice: "onyx",
            model: "tts-1",
        });

        responses.push(response);
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
