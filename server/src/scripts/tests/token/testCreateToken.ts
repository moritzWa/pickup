// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/tests/token/testCreateToken.ts

import { Dictionary, capitalize } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider, Token } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { Slack, SlackChannel, coingecko } from "src/utils";
import { birdeye } from "src/utils/birdeye";
import { DateTime } from "luxon";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    failureAndLog,
    hasValue,
    success,
} from "src/core/logic";

export const run = async () => {
    // get token
    const tokenResp = await TokenService.findOne({
        where: {
            contractAddress: "FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv",
        },
    });
    throwIfError(tokenResp);
    const token = tokenResp.value;

    // delete token
    const deleteResp = await TokenService.deleteById(token.id);
    throwIfError(deleteResp);

    // create token
    const tokenParams = {
        ...token,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        categories: undefined,
    };
    const createResp = await TokenService.create({
        ...tokenParams,
    });
    throwIfError(createResp);
    console.log("Successfully created token");
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
