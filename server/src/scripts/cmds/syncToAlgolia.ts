// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/cmds/syncToAlgolia.ts

import "src/modules/discovery/services/discoveryService";
import { Dictionary, keyBy } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { Category } from "src/core/infra/postgres/entities/Token";
import { _getTokens } from "src/modules/discovery/services/discoveryService/providers/solana/jupiter";
import { tokenRepo } from "src/modules/trading/infra/postgres";
import { algolia } from "src/utils/algolia";
import { In } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import _ = require("lodash");

export const run = async () => {
    // add irl name field to algolia tokens
    const algoliaTokensResp = await algolia.tokens.fetchAll();
    throwIfError(algoliaTokensResp);
    const algoliaTokens = algoliaTokensResp.value;
    const algoliaTokensByAddress = _.keyBy(
        algoliaTokens,
        (t) => t.contractAddress
    );

    // get all tokens in DB
    const tokensResp = await TokenService.find({});
    throwIfError(tokensResp);
    const tokens = tokensResp.value;

    // filter tokens
    const missingInAlgolia = tokens.filter(
        (t) => !algoliaTokensByAddress[t.contractAddress]
    );

    // sync to algolia
    const updateResp = await algolia.tokens.save(
        missingInAlgolia.map((m) => ({
            ...m,
            objectID: m.contractAddress,
        }))
    );

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
