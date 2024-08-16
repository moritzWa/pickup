import axios from "axios";
import { firebase, openai } from "src/utils";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import { performance } from "perf_hooks";

// const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpegStatic = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegStatic);

const CHUNK_SIZE_SECONDS = 30; // 5 minutes

export type AudioDataChunk = {
    transcript: string;
    start: number;
    end: number;
    firebaseUrl: string;
};

async function splitAudio(
    filePath: string,
    outputDir: string
): Promise<FailureOrSuccess<DefaultErrors, null>> {
    return new Promise((resolve) => {
        const outputOptions: string[] = [
            "-f",
            "segment", // Segment the audio
            "-segment_time",
            CHUNK_SIZE_SECONDS.toString(), // Segment time of 300 seconds (5 minutes)
        ];

        try {
            ffmpeg(filePath)
                // .audioCodec("libmp3lame")
                // .audioBitrate("192k")
                .outputOptions(outputOptions)
                .save(path.join(outputDir, "output%03d.m4a"))
                .on("end", () => {
                    // debugger;
                    resolve(success(null));
                })
                .on("error", (err) => {
                    // debugger;
                    resolve(failure(new UnexpectedError(err)));
                });
        } catch (err) {
            // debugger;
            return failure(new UnexpectedError(err));
        }
    });
}

const transcribeAudioUrl = async (
    url: string
): Promise<FailureOrSuccess<DefaultErrors, AudioDataChunk[]>> => {
    const startTime = performance.now();
    console.log(`[Performance] Starting transcription for URL: ${url}`);

    try {
        const audioResponse = await axios({
            method: "get",
            url,
            responseType: "arraybuffer",
        });

        const data = audioResponse.data;

        const hash = uuidv4();
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, "temp_audio.m4a");
        const outputDir = path.join(tempDir, hash);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        // Write the audio data to the temporary file
        await fs.promises.writeFile(tempFilePath, Buffer.from(data));

        console.log(
            `[Performance] Audio download completed in ${
                performance.now() - startTime
            }ms`
        );

        const splitAudioResponse = await splitAudio(tempFilePath, outputDir);

        if (splitAudioResponse.isFailure()) {
            return failure(splitAudioResponse.error);
        }

        console.log(
            `[Performance] Audio splitting completed in ${
                performance.now() - startTime
            }ms`
        );

        const files = fs
            .readdirSync(outputDir)
            .filter((file) => file.endsWith(".mp3") || file.endsWith(".m4a"));

        const filesWithIndex = files.map((file, i) => ({
            name: file,
            index: i,
        }));

        const chunkStartTime = performance.now();
        const chunks = await Promise.all(
            filesWithIndex.map(async (fileWithIndex) => {
                const fileName = fileWithIndex.name;
                const i = fileWithIndex.index;

                const filePath = path.join(outputDir, fileName);

                const start = i * CHUNK_SIZE_SECONDS;
                const end = (i + 1) * CHUNK_SIZE_SECONDS;

                // Create a read stream from the temporary file
                const audioStream = fs.createReadStream(filePath);
                const audioBuffer = fs.readFileSync(filePath);

                const storageResponse = await firebase.storage.uploadBuffer(
                    audioBuffer,
                    // m4a file
                    "audio/m4a"
                );

                if (storageResponse.isFailure()) {
                    return null;
                }

                const storedFile = storageResponse.value;

                const transcriptionResponse = await openai.audio.transcribe(
                    audioStream
                );

                if (transcriptionResponse.isFailure()) {
                    return null;
                }

                const transcript = transcriptionResponse.value;

                // unlink the file
                await fs.promises.unlink(filePath);

                return {
                    transcript,
                    start,
                    end,
                    firebaseUrl: storedFile.originalUrl,
                };
            })
        );

        console.log(
            `[Performance] Chunk processing completed in ${
                performance.now() - chunkStartTime
            }ms`
        );

        const failures = chunks.filter((c) => c === null);

        if (failures.length > 0) {
            console.log(`[failures for content ${url}]`);
            console.log(failures);
            debugger;
        }

        // delete all files under the outputDir and the temp dir
        await Promise.all([
            fs.promises.unlink(tempFilePath),
            fs.promises.rmdir(outputDir, { recursive: true }),
        ]);

        const endTime = performance.now();
        console.log(
            `[Performance] Total transcription time: ${endTime - startTime}ms`
        );

        return success(chunks.filter(hasValue));
    } catch (err) {
        const endTime = performance.now();
        console.error(
            `[Performance] Transcription failed after ${endTime - startTime}ms`
        );
        return failure(new UnexpectedError(err));
    }
};

export const TranscribeService = {
    transcribeAudioUrl,
};

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error.message);
    // Optional: You might want to gracefully shut down the server here
    // process.exit(1); // Uncomment to stop the server on uncaught exceptions
});
