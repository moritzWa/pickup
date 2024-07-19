// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-05-24-token_irl_name.ts

import "src/modules/discovery/services/discoveryService";
import { Dictionary, keyBy } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { Category } from "src/core/infra/postgres/entities/Token";
import { _getTokens } from "src/modules/discovery/services/discoveryService/providers/solana/jupiter";
import { pgCategoryEntryRepo } from "src/modules/categories/infra";
import { tokenRepo } from "src/modules/trading/infra/postgres";
import { algolia } from "src/utils/algolia";
import { In } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";

export const run = async () => {
    // get all category entries
    const categoryEntriesResp = await pgCategoryEntryRepo.find({});
    throwIfError(categoryEntriesResp);
    const categoryEntries = categoryEntriesResp.value;

    // get all tokens
    const tokensResp = await tokenRepo.find({
        where: {
            id: In(categoryEntries.map((ce) => ce.tokenId)),
        },
    });
    throwIfError(tokensResp);
    const tokens = tokensResp.value;

    // update each token
    for (const token of tokens) {
        const categoryEntry = categoryEntries.find(
            (ce) => ce.tokenId === token.id
        );
        if (!categoryEntry) {
            console.error(
                `No category entry found for token ${token.contractAddress}`
            );
            continue;
        }

        token.irlName = categoryEntry.name;
        console.log("Updated token", token.contractAddress, token.irlName);
    }

    // save all tokens
    const updateResp = await TokenService.saveMany(tokens);
    throwIfError(updateResp);
    console.log("Done");
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
