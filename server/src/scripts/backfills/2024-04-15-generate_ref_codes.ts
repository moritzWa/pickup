// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-04-15-generate_ref_codes.ts
import { connect } from "src/core/infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ReferralService } from "src/modules/referral/services";
import { UserService } from "src/modules/users/services";

export const run = async () => {
    // get users
    const usersResp = await UserService.find({});
    throwIfError(usersResp);
    const users = usersResp.value;

    // iterate through each and update ref code
    for (const user of users) {
        const resp = await UserService.update(user.id, {
            referralCode: ReferralService.getReferralCode(),
        });
        throwIfError(resp);
    }
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
