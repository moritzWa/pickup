// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/{date}_{file_name}.ts

import { parallel } from "radash";
import { connect } from "src/core/infra/postgres";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { loops } from "src/utils/loops";

const NOT_ALLOWED = new Set(["hotateman115826@gmail.com"]);

export const run = async () => {
    const usersResponse = await pgUserRepo.find({});

    const users = usersResponse.value;

    const toAdd = users.filter((u) => !NOT_ALLOWED.has(u.email));

    debugger;

    await parallel(3, toAdd, async (a) =>
        loops.contacts.create({
            email: a.email,
            userId: a.id,
            fullName: a.name,
        })
    );

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
