import { connect } from "src/core/infra/postgres";
import _ = require("lodash");
import axios from "axios";
import { openai } from "src/utils";
import { createReadStream } from "fs";
import { Readable } from "stream";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { contentRepo, feedRepo } from "src/modules/content/infra";
import { v4 as uuidv4 } from "uuid";
import { pgUserRepo } from "src/modules/users/infra/postgres";

export const run = async () => {
    // take all the content and seed a queue for each user
    const users = await pgUserRepo.find({});
    const content = await contentRepo.find({});

    for (const user of users.value) {
        for (let i = 0; i < content.value.length; i++) {
            const c = content.value[i];
            await feedRepo.create({
                id: uuidv4(),
                insertionId: uuidv4(),
                isArchived: false,
                position: i,
                isQueued: false,
                queuedAt: null,
                userId: user.id,
                contentId: c.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }

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
