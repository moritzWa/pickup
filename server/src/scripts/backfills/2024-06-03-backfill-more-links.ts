// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-06-03-backfill-more-links.ts

import "src/modules/discovery/services/discoveryService";
import { Dictionary, keyBy } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import {
    Category,
    MemecoinLinkType,
    Token,
} from "src/core/infra/postgres/entities/Token";
import { _getTokens } from "src/modules/discovery/services/discoveryService/providers/solana/jupiter";
import { pgCategoryEntryRepo } from "src/modules/categories/infra";
import { tokenRepo } from "src/modules/trading/infra/postgres";
import { algolia } from "src/utils/algolia";
import { In, IsNull, Not } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { DefaultErrors, FailureOrSuccess, success } from "src/core/logic";
import { fork, parallel } from "radash";
import { pgTokenRepo } from "src/modules/tokens/postgres";

export const run = async () => {
    // get all tokens with a twitter, telegram, or website
    const tokensResponse = await TokenService.find({
        where: [
            {
                telegramLink: Not(IsNull()),
            },
            {
                twitterLink: Not(IsNull()),
            },
            {
                websiteLink: Not(IsNull()),
            },
        ],
    });
    throwIfError(tokensResponse);
    const tokens = tokensResponse.value;

    // add to more links
    const updatedTokens = tokens.map((token) => {
        if (token.telegramLink) {
            token.moreLinks = token.moreLinks.filter(
                (t) => t.type !== MemecoinLinkType.Telegram
            );
            token.moreLinks.push({
                type: MemecoinLinkType.Telegram,
                url: token.telegramLink,
                alwaysShow: true,
            });
        }
        if (token.twitterLink) {
            token.moreLinks = token.moreLinks.filter(
                (t) => t.type !== MemecoinLinkType.Twitter
            );
            token.moreLinks.push({
                type: MemecoinLinkType.Twitter,
                url: token.twitterLink,
                alwaysShow: true,
            });
        }
        if (token.websiteLink) {
            token.moreLinks = token.moreLinks.filter(
                (t) => t.type !== MemecoinLinkType.Website
            );
            token.moreLinks.push({
                type: MemecoinLinkType.Website,
                url: token.websiteLink,
                alwaysShow: true,
            });
        }

        return token;
    });

    // save to DB
    const updatedTokensResponse = await parallel(10, updatedTokens, async (t) =>
        tokenRepo.update(t.id, {
            moreLinks: t.moreLinks,
        })
    );
};

const _fillInSlugs = async (
    tokens: Token[]
): Promise<FailureOrSuccess<DefaultErrors, Token[]>> => {
    const slugs = await parallel(10, tokens, async (token) => {
        const slug = await TokenService.getSlug(token);
        return pgTokenRepo.update(token.id, { slug });
    });

    const failures = slugs.filter((s) => s.isFailure());

    if (failures.length > 0) {
        debugger;
    }

    const newSlugs = slugs.map((s) => s.value);

    const allTokens = [...newSlugs];

    return success(allTokens);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
