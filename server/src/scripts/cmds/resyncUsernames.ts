// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/cmds/resyncUsernames.ts

import { connect } from "src/core/infra/postgres";
import { AccountProvider, Airdrop } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { runSyncUsernamesCron } from "src/jobs/inngest/functions/scheduled/syncUsernames";
import { airdropRepo } from "src/modules/airdrops/infra/postgres";
import { UserService } from "src/modules/users/services";
import { magic } from "src/utils/magic";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { v4 as uuidv4 } from "uuid";

export const run = async () => {
    const userIdsResp = await UserService.find({});
    throwIfError(userIdsResp);

    const userResp = await UserService.bulkUpdate(
        userIdsResp.value.map((user) => user.id),
        {
            usernameSynced: false,
        }
    );
    throwIfError(userResp);

    const runResp = await runSyncUsernamesCron();
    console.log(runResp);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING MAKE AIRDROP =====");
        console.error(err);
        process.exit(1);
    });
