// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/cmds/markIsNotDead.ts

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

const NOT_DEAD = ["GcWQoPvZWh5UiyhMniaMMLeuTkfDEe5StSVkrPwmvHZd"];

export const run = async () => {
    for (const notDeadToken of NOT_DEAD) {
        // get from DB
        const tokenResp = await TokenService.findOne({
            where: {
                contractAddress: notDeadToken,
            },
        });
        throwIfError(tokenResp);
        if (!tokenResp.value) {
            throw new Error(`Token not found: ${notDeadToken}`);
            continue;
        }
        const token = tokenResp.value;

        // update DB
        const updateResp = await TokenService.update(token.id, {
            isDead: false,
        });
        throwIfError(updateResp);

        // save to algolia
        const algoliaTokenResp = await algolia.tokens.save([
            {
                ...token,
                objectID: token.contractAddress,
            },
        ]);
    }

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
