// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import { connect } from "src/core/infra/postgres";
import { magic } from "src/utils/magic";

export const run = async () => {
    // await magic.users.fromDid();
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
