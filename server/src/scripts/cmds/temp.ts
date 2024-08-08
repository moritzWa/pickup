import { connect } from "src/core/infra/postgres";
import _ = require("lodash");
import axios from "axios";
import { openai } from "src/utils";
import { createReadStream } from "fs";
import { Readable } from "stream";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { contentRepo } from "src/modules/content/infra";
import { v4 as uuidv4 } from "uuid";

export const run = async () => {
    // const url = `https://firebasestorage.googleapis.com/v0/b/learning-dev-ai.appspot.com/o/users%2Fu2A1pY882yfQdTVwr9Lsf8aBnei1%2Frecordings%2F1721722754853-recording-96F6DF0B-BE6F-431F-980D-D052FA0119B7.m4a?alt=media&token=ce090911-f6f3-4654-980e-deb6a4c1dbf3`;

    // const respondResponse = await ResponseService.respond(lesson.value[0], url);

    const questions = [
        "Why is it important for a product manager to act like the 'CEO of the product'?",
        "How can a product manager be proactive instead of reactive in their role?",
        "Why is clear, written communication essential for a good product manager?",
        "How should a product manager focus on delivering value to the marketplace?",
    ];

    await contentRepo.update("ba126edd-2cf4-49c3-ac49-45ae7abe4d88", {
        followUpQuestions: questions.map((question) => ({
            question,
            answer: "",
            id: uuidv4(),
        })),
    });

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
