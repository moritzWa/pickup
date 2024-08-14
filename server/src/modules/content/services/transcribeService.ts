import axios from "axios";
import { openai } from "src/utils";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import * as ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";

// const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpegStatic = require("ffmpeg-static");

console.log(ffmpegStatic);

ffmpeg.setFfmpegPath(ffmpegStatic);

const CHUNK_SIZE_SECONDS = 300; // 5 minutes

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
                    debugger;
                    resolve(success(null));
                })
                .on("error", (err) => {
                    debugger;
                    resolve(failure(new UnexpectedError(err)));
                });
        } catch (err) {
            debugger;
            return failure(new UnexpectedError(err));
        }
    });
}

const transcribeAudioUrl = async (
    url: string
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
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

        const splitAudioResponse = await splitAudio(tempFilePath, outputDir);

        if (splitAudioResponse.isFailure()) {
            return failure(splitAudioResponse.error);
        }

        const files = fs
            .readdirSync(outputDir)
            .filter((file) => file.endsWith(".mp3"));

        const fullTranscript: string[] = [];

        debugger;

        for (const filePath of files) {
            // Create a read stream from the temporary file
            const audioStream = fs.createReadStream(filePath);

            const transcriptionResponse = await openai.audio.transcribe(
                audioStream
            );

            if (transcriptionResponse.isFailure()) {
                return failure(transcriptionResponse.error);
            }

            const transcript = transcriptionResponse.value;

            fullTranscript.push(transcript);

            // unlink the file
            await fs.promises.unlink(filePath);
        }

        // delete all files under the outputDir and the temp dir
        await fs.promises.unlink(tempFilePath);

        return success(fullTranscript.join(" "));
    } catch (err) {
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
