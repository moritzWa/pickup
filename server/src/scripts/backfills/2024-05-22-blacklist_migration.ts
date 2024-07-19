// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-05-22-blacklist_migration.ts

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
import { SyncJupiterTokensService } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService";
import { Account } from "aws-sdk";
import { UserService } from "src/modules/users/services";
import { ProfileService } from "src/modules/profile/services";
import {
    uniqueNamesGenerator,
    adjectives,
    colors,
    animals,
    NumberDictionary,
} from "unique-names-generator";
import _ = require("lodash");
import { checkDeadTokensHelper } from "src/modules/tokens/services/tokenService/checkDeadTokens";
import { UNITED_NATIONS } from "src/modules/categories/services/categoryService/categories/UNITED_NATIONS";
import { CategoryEntryParams } from "src/modules/categories/infra/postgres/categoryEntryRepo";
import {
    BlacklistReason,
    MemecoinLinkType,
} from "src/core/infra/postgres/entities/Token";
import { CategoryEntryService } from "src/modules/categories/services/categoryService";
import { BlacklistService } from "src/modules/discovery/services";
import { In } from "typeorm";

export const run = async () => {
    // fetch blacklist
    const blacklistResp = await BlacklistService.findAll();
    throwIfError(blacklistResp);
    const blacklist = blacklistResp.value;

    // fetch relevant tokens
    const tokensResp = await TokenService.find({
        where: {
            contractAddress: In(blacklist.map((b) => b.contractAddress)),
            provider: AccountProvider.Solana,
        },
    });
    throwIfError(tokensResp);
    const tokens = tokensResp.value;

    // update
    tokens.forEach((t) => {
        t.isBlacklisted = BlacklistReason.NotMeme;
    });
    const saveManyResp = await TokenService.saveMany(tokens);
    throwIfError(saveManyResp);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
