// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/csvs/getTopThousandTokens.ts

import { connect } from "src/core/infra/postgres";
import { MemecoinLinkType } from "src/core/infra/postgres/entities/Token";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { fetchNewJupiterTokens } from "src/modules/discovery/services/discoveryService/syncJupiterTokensService/fetchNewJupiterTokens";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { coingecko } from "src/utils";
import { birdeye } from "src/utils/birdeye";
import { magic } from "src/utils/magic";
import { IsNull, Not } from "typeorm";

/* 
1. Gets top 1000 tokens by volume
2. Fills in their twitter
3. Then, run this sql query to get the list:
SELECT symbol, name, contract_address
FROM tokens
WHERE fdv IS NOT NULL 
ORDER BY vol24h DESC
LIMIT 1000
*/

export const run = async () => {
    // get top 1000 tokens by volume
    const tokensResp = await TokenService.find({
        where: {
            fdv: Not(IsNull()),
        },
        order: {
            vol24h: "DESC",
        },
        take: 1000,
    });
    throwIfError(tokensResp);
    const tokens = tokensResp.value;

    // for each coin, fill in their twitter
    for (const token of tokens) {
        console.log("Analyzing tokenP: ", token.contractAddress);
        if (token.moreLinks.some((t) => t.type === MemecoinLinkType.Twitter))
            continue;
        if (
            token.contractAddress ===
            "mDBNSUv8LZzktDAGpDJVRWSfCpCjgeDeHYkeHtz97ka"
        )
            debugger;

        const [birdeyeResp, cgResp] = await Promise.all([
            birdeye.getTokenOverview(
                token.provider,
                token.contractAddress,
                false,
                "getTopThousandTokens()"
            ),
            coingecko.getCoingeckoForContract(
                token.provider,
                token.contractAddress
            ),
        ]);
        throwIfError(birdeyeResp);
        const bird = birdeyeResp.value;
        const cg = cgResp.isFailure() ? null : cgResp.value;

        const birdTwitter = bird?.data?.extensions?.twitter || null;
        const cgTwitter = cg?.links.twitter_screen_name
            ? `https://x.com/${cg.links.twitter_screen_name}`
            : null;

        const twitter = birdTwitter || cgTwitter || null;

        if (twitter) {
            token.moreLinks.push({
                type: MemecoinLinkType.Twitter,
                url: twitter,
            });
            const saveResp = await TokenService.save(token);
            throwIfError(saveResp);
            console.log("Added twitter for token: ", twitter);
        }
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
