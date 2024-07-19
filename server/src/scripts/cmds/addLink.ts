// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/cmds/addLink.ts

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
    MemecoinLink,
    MemecoinLinkType,
} from "src/core/infra/postgres/entities/Token";

const GROUPS = [
    {
        links: [
            {
                type: MemecoinLinkType.Birdeye,
                url: "https://birdeye.so/token/FxwbKC8s3dq8kkwJyHN5KEwDuhzawgfTmWRnfnX6jBho?chain=solana",
            },
            {
                type: MemecoinLinkType.DexTools,
                url: "https://www.dextools.io/app/en/solana/pair-explorer/8p3hFKLBuAZTS65v5KuzrVyCenPFaj5Zigb2ZJdZmhLa?t=1716596058342",
            },
        ],
        address: "FxwbKC8s3dq8kkwJyHN5KEwDuhzawgfTmWRnfnX6jBho",
    },
];

export const run = async () => {
    for (const { links, address } of GROUPS) {
        // more links
        const tokenResp = await TokenService.findOne({
            where: {
                provider: AccountProvider.Solana,
                contractAddress: address,
            },
        });
        throwIfError(tokenResp);
        const token = tokenResp.value;

        // add link
        links.forEach((m) => token.moreLinks.push(m));

        // save
        const saveResp = await TokenService.save(token);
    }
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
