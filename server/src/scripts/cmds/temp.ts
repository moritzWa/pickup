import { connect } from "src/core/infra/postgres";
import _ = require("lodash");
import axios from "axios";
import { openai } from "src/utils";
import { createReadStream } from "fs";
import { Readable } from "stream";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { ResponseService } from "src/modules/lessons/services/respondService";
import { lessonRepo } from "src/modules/lessons/infra";

export const run = async () => {
    const lesson = await lessonRepo.find({});

    const url = `https://firebasestorage.googleapis.com/v0/b/learning-dev-ai.appspot.com/o/users%2Fu2A1pY882yfQdTVwr9Lsf8aBnei1%2Frecordings%2F1721722754853-recording-96F6DF0B-BE6F-431F-980D-D052FA0119B7.m4a?alt=media&token=ce090911-f6f3-4654-980e-deb6a4c1dbf3`;

    const respondResponse = await ResponseService.respond(lesson.value[0], url);

    console.log(respondResponse);

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
