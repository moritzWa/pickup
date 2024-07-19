// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/tests/token/testCreateToken.ts

import { Dictionary, capitalize } from "lodash";
import { connect } from "src/core/infra/postgres";
import { AccountProvider, Token } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { Slack, SlackChannel, coingecko, firebase } from "src/utils";
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
import { CurrentPriceService } from "src/modules/tokens/services/currentPriceService";
import { TradingIntegrationService } from "src/shared/integrations";
import { cloudflare } from "src/utils/cloudflare";
import { inngest } from "src/jobs/inngest/clients";
import { InngestEventName } from "src/jobs/inngest/types";

export const run = async () => {
    await inngest.send({
        name: InngestEventName.UploadImageToFirebase,
        data: {
            imageUrl:
                "https://cf-ipfs.com/ipfs/QmNx9PTAPm7R6NN9t8Ed5jbdiqXZyQAfGkvLHt1292bsq2",
            tokenId: "8372d2e1-aeca-421a-b6f0-b66e8ef8599a",
        },
    });

    const url =
        "https://cf-ipfs.com/ipfs/QmUNHd4Tnm5VdAJUWntGy5fKZ9nP9AmrqHovRz3bwsAHcP";

    await firebase.storage.upload(url);

    debugger;
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
