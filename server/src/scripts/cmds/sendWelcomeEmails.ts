import { connect } from "src/core/infra/postgres";
import { AccountProvider, Airdrop } from "src/core/infra/postgres/entities";
import { runHowDidYouFindUsEmail } from "src/jobs/inngest/functions/scheduled/howDidYouFindUsEmail";
import { airdropRepo } from "src/modules/airdrops/infra/postgres";
import { magic } from "src/utils/magic";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { v4 as uuidv4 } from "uuid";

export const run = async () => {
    await runHowDidYouFindUsEmail();

    debugger;
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING MAKE AIRDROP =====");
        console.error(err);
        process.exit(1);
    });
