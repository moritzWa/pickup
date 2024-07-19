// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-05-24-token_irl_name.ts

import "src/modules/discovery/services/discoveryService";
import { Dictionary, keyBy } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { Category, Token } from "src/core/infra/postgres/entities/Token";
import { _getTokens } from "src/modules/discovery/services/discoveryService/providers/solana/jupiter";
import { pgCategoryEntryRepo } from "src/modules/categories/infra";
import { tokenRepo } from "src/modules/trading/infra/postgres";
import { algolia } from "src/utils/algolia";
import { In } from "typeorm";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { DefaultErrors, FailureOrSuccess, success } from "src/core/logic";
import { fork, parallel } from "radash";
import { pgTokenRepo } from "src/modules/tokens/postgres";

export const run = async () => {
    const entriesResponse = await pgCategoryEntryRepo.find({
        relations: {
            token: true,
        },
    });

    throwIfError(entriesResponse);

    const entries = entriesResponse.value;
    const tokens = entries.map((entry) => entry.token);

    const allTokensResponse = await _fillInSlugs(tokens);
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
