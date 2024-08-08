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

        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, "temp_audio.m4a");

        // Write the audio data to the temporary file
        await fs.promises.writeFile(tempFilePath, Buffer.from(data));

        // Create a read stream from the temporary file
        const audioStream = fs.createReadStream(tempFilePath);

        const transcriptionResponse = await openai.audio.transcribe(
            audioStream
        );

        await fs.promises.unlink(tempFilePath);

        return transcriptionResponse;
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const TranscribeService = {
    transcribeAudioUrl,
};
