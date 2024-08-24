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
import { buildQueue } from "src/modules/content/services/queueService";

export const run = async () => {
    const userResponse = await pgUserRepo.findByEmail(
        "andrew+testprod@awaken.tax"
    );

    // take all the content and seed a queue for each user
    const response = await buildQueue(userResponse.value, 10);

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
