// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-06-07-algolia-influencers.ts

import { parallel } from "radash";
import { connect } from "src/core/infra/postgres";
import { Category } from "src/core/infra/postgres/entities/Token";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { CategoryEntryService } from "src/modules/categories/services";
import { DiscoveryService } from "src/modules/discovery/services";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { pgUserRepo } from "src/modules/users/infra/postgres";
import { algolia } from "src/utils/algolia";
import { loops } from "src/utils/loops";
import { In } from "typeorm";

const NOT_ALLOWED = new Set(["hotateman115826@gmail.com"]);

export const run = async () => {
    // get influencers
    const influencersResp = await CategoryEntryService.getCategoryTokens(
        Category.Influencers
    );
    throwIfError(influencersResp);
    const influencers = influencersResp.value;
    const tokenIds = influencers.tokens.map((t) => t.id);

    // get tokens
    const tokensResp = await TokenService.find({
        where: {
            id: In(tokenIds),
        },
    });
    throwIfError(tokensResp);
    const tokens = tokensResp.value;

    // update algolia
    const algoliaResp = await algolia.tokens.save(
        tokens.map((t) => ({
            ...t,
            objectID: t.id,
        }))
    );
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
