// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/temp.ts

import { Dictionary, capitalize } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider, Token } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { Slack, SlackChannel, coingecko, helius } from "src/utils";

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
import {
    NexusGenEnums,
    NexusGenObjects,
    NexusGenRootTypes,
} from "src/core/surfaces/graphql/generated/nexus";
import _ = require("lodash");
import { checkDeadTokensHelper } from "src/modules/tokens/services/tokenService/checkDeadTokens";
import { UNITED_NATIONS } from "src/modules/categories/services/categoryService/categories/UNITED_NATIONS";
import { CategoryEntryParams } from "src/modules/categories/infra/postgres/categoryEntryRepo";
import { MemecoinLinkType } from "src/core/infra/postgres/entities/Token";
import { CategoryEntryService } from "src/modules/categories/services/categoryService";
import { BlacklistService } from "src/modules/discovery/services";
import { In, IsNull, Not } from "typeorm";
import { algolia } from "src/utils/algolia";
import { updateJupiterMarketCaps } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService/updateJupiterMarketCaps";
import { JupiterService } from "src/modules/trading/services/tradingProviders";
import { SolanaDiscoveryProvider } from "src/modules/discovery/services/discoveryService/providers/solana";
import { decodeFromBase64 } from "pdf-lib";
import { _warmCategories } from "src/jobs/inngest/functions/scheduled/warmCategories";
import { _addSocialLinks } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService/fetchNewJupiterTokens";
import { DiscoveryResultTypeEnum } from "src/modules/discovery/graphql";
import { SyncJupiterTokensService } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService";
import { SwapService } from "src/modules/trading/services";

export const run = async () => {
    // get swaps
    const mySwapsResp = await SwapService.find({
        where: {
            userId: "b8dcdf10-9120-47f8-bedc-4c64d8d0cce3",
        },
        order: { createdAt: "asc" },
        take: 1,
        // take: 1,
    });
    console.log(mySwapsResp);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
