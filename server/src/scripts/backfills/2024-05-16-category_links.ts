// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-05-16-category_links.ts

import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import {
    Category as CategoryType,
    Token,
} from "src/core/infra/postgres/entities/Token";
import { DefaultErrors, FailureOrSuccess, success } from "src/core/logic";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { POLITICS } from "src/modules/categories/services/categoryService/categories/POLITICS";
import { RELIGION } from "src/modules/categories/services/categoryService/categories/RELIGION";
import { UNITED_NATIONS } from "src/modules/categories/services/categoryService/categories/UNITED_NATIONS";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";

export const run = async () => {
    const categoryEntries = [
        ...UNITED_NATIONS.tokens,
        ...POLITICS.tokens,
        ...RELIGION.tokens,
    ];

    const newTokens: Token[] = [];

    // for each category, override the token's twitter + website links
    for (const ce of categoryEntries) {
        const tokenResp = await TokenService.findOne({
            where: {
                provider: AccountProvider.Solana,
                contractAddress: ce.contractAddress,
            },
        });
        throwIfError(tokenResp);
        const token = tokenResp.value;

        // update token with new links
        newTokens.push({
            ...token,
            twitterLink: ce.twitter || token.twitterLink,
            websiteLink: ce.website || token.websiteLink,
        });
    }

    // save all tokens
    const saveTokensResp = await TokenService.saveMany(newTokens);
    throwIfError(saveTokensResp);
    console.log("Updated token links");
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
