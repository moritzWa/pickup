// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-05-13-token.ts

import BigNumber from "bignumber.js";
import { Dictionary } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { hasValue } from "src/core/logic";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { coingecko } from "src/utils";
import { algolia } from "src/utils/algolia";

export const run = async () => {
    // get all tokens
    const algoliaTokensResp = await algolia.tokens.fetchAll();
    throwIfError(algoliaTokensResp);
    const algoliaTokens = algoliaTokensResp.value;

    // save to db
    // TODO
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
