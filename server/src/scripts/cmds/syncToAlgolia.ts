// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/cmds/syncToAlgolia.ts

import "src/modules/discovery/services/discoveryService";
import { Dictionary, keyBy } from "lodash";
import { connect } from "src/core/infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import _ = require("lodash");

export const run = async () => {
    console.log("done");
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
