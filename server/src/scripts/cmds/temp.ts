import { connect } from "src/core/infra/postgres";
import _ = require("lodash");
import axios from "axios";
import { openai } from "src/utils";
import { createReadStream } from "fs";
import { Readable } from "stream";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

export const run = async () => {
    const url = `https://firebasestorage.googleapis.com/v0/b/learning-dev-ai.appspot.com/o/users%2Fu2A1pY882yfQdTVwr9Lsf8aBnei1%2Frecordings%2F1721722754853-recording-96F6DF0B-BE6F-431F-980D-D052FA0119B7.m4a?alt=media&token=ce090911-f6f3-4654-980e-deb6a4c1dbf3`;

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

    const transcriptionResponse = await openai.audio.transcribe(audioStream);

    await fs.promises.unlink(tempFilePath);

    console.log(transcriptionResponse.value);

    debugger;
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
