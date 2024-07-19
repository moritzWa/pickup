// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/cmds/syncAlgoliaIrlNames.ts

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

    // get all tokens in DB with irl name
    const tokensResp = await TokenService.find({});
    throwIfError(tokensResp);
    const tokens = tokensResp.value;
    const tokensWithIrlName = tokens.filter((token) => token.irlName);
    const tokensByAddress = _.keyBy(
        tokensWithIrlName,
        (t) => t.contractAddress
    );

    // add irl name field to algolia tokens
    const updatedTokens = algoliaTokens
        .map((token) => {
            return {
                ...token,
                irlName:
                    tokensByAddress[token.contractAddress]?.irlName || null,
            };
        })
        .filter((token) => token.irlName);
    const updateResp = await algolia.tokens.save(updatedTokens);

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
