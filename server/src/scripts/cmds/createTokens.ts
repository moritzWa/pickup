// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/cmds/createTokens.ts

import { connect } from "src/core/infra/postgres";
import { fetchNewJupiterTokens } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService/fetchNewJupiterTokens";
import { magic } from "src/utils/magic";

export const run = async () => {
    // await magic.users.fromDid();
    await fetchNewJupiterTokens();

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
