// import { connect } from "src/core/infra/postgres";
// import _ = require("lodash");
// import axios from "axios";
// import { openai } from "src/utils";
// import { createReadStream } from "fs";
// import { Readable } from "stream";
// import * as path from "path";
// import * as os from "os";
// import * as fs from "fs";
// import { ResponseService } from "src/modules/lessons/services/respondService";
// import { lessonRepo } from "src/modules/lessons/infra";
// import { contentRepo } from "src/modules/content/infra";
// import { v4 as uuidv4 } from "uuid";

// export const run = async () => {
//     const lesson = await lessonRepo.find({});
//     const speechFile = path.resolve("./speech.mp3");

//     // const url = `https://firebasestorage.googleapis.com/v0/b/learning-dev-ai.appspot.com/o/users%2Fu2A1pY882yfQdTVwr9Lsf8aBnei1%2Frecordings%2F1721722754853-recording-96F6DF0B-BE6F-431F-980D-D052FA0119B7.m4a?alt=media&token=ce090911-f6f3-4654-980e-deb6a4c1dbf3`;

//     // const respondResponse = await ResponseService.respond(lesson.value[0], url);
//     const text =
//         "Obstinacy is a reflexive resistance to changing one's ideas. This is not identical with stupidity, but they're closely related. A reflexive resistance to changing one's ideas becomes a sort of induced stupidity as contrary evidence mounts. And obstinacy is a form of not giving up that's easily practiced by the stupid. You don't have to consider complicated tradeoffs; you just dig in your heels. It even works, up to a point.";

//     const mp3 = await openai.audio.speak({
//         model: "tts-1",
//         voice: "alloy",
//         text,
//     });

//     console.log(speechFile);

//     debugger;

//     await fs.promises.writeFile(speechFile, mp3.value);

//     debugger;
// };

// connect()
//     .then(() => run())
//     .then(() => process.exit(0))
//     .catch((err) => {
//         console.error("===== ERROR RUNNING BACKFILL =====");
//         console.error(err);
//         process.exit(1);
//     });
