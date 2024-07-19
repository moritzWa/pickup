// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-04-27-algolia_volumes_vol24h.ts

import BigNumber from "bignumber.js";
import { Dictionary } from "lodash";
import { DateTime } from "luxon";
import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { hasValue } from "src/core/logic";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { DiscoverySplashCacheService } from "src/modules/discovery/services";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { coingecko } from "src/utils";
import { algolia } from "src/utils/algolia";
// import { BlacklistService } from "src/modules/discovery/services/deprecated_blacklistCacheService";

export const run = async () => {
    // // get all tokens
    // const algoliaTokensResp = await algolia.tokens.fetchAll();
    // throwIfError(algoliaTokensResp);
    // const algoliaTokens = algoliaTokensResp.value;
    // const tokensForUpdate = algoliaTokens.filter((token) => {
    //     return !token.vol24h && token.fdvDNE === false;
    // });
    // const vol24hObj: Dictionary<number | "does_not_exist"> = {};
    // // pages
    // const pages = Math.ceil(
    //     tokensForUpdate.length / coingecko.dex.MAX_ADDRESSES
    // );
    // for (let i = 0; i < pages; i++) {
    //     if (i > 0 && i % 10 === 0) {
    //         console.log("Going through the " + i + "th page of tokens...");
    //     }
    //     const tokensPage = tokensForUpdate
    //         .map((token) => token.contractAddress)
    //         .slice(
    //             i * coingecko.dex.MAX_ADDRESSES,
    //             (i + 1) * coingecko.dex.MAX_ADDRESSES
    //         );
    //     const marketCapsResp = await coingecko.dex.getTokens(
    //         AccountProvider.Solana,
    //         tokensPage
    //     );
    //     if (marketCapsResp.isFailure()) continue;
    //     const marketCaps = marketCapsResp.value; // result excludes any missing tokens
    //     marketCaps.forEach((v) => {
    //         const key = TokenService.buildKey(
    //             AccountProvider.Solana,
    //             v.attributes.address
    //         );
    //         const vol24h =
    //             v?.attributes?.volume_usd.h24 !== null &&
    //             v?.attributes?.volume_usd.h24 !== undefined &&
    //             v?.attributes?.volume_usd.h24 !== ""
    //                 ? Math.floor(
    //                       new BigNumber(v.attributes.volume_usd.h24).toNumber()
    //                   )
    //                 : "does_not_exist";
    //         if (vol24h !== "does_not_exist") {
    //             vol24hObj[key] = vol24h;
    //         } else {
    //             console.log("dne: ", key);
    //         }
    //     });
    //     // any ones that we couldn't pull the data for, label as "does not exist"
    //     tokensPage.forEach((contractAddress) => {
    //         const key = TokenService.buildKey(
    //             AccountProvider.Solana,
    //             contractAddress
    //         );
    //         if (vol24hObj[key] === undefined) {
    //             vol24hObj[key] = "does_not_exist";
    //         }
    //     });
    // }
    // // save to algolia
    // const updatedTokens: RawTokenInfo[] = tokensForUpdate
    //     .map((t) => {
    //         const key = TokenService.buildKey(
    //             t.provider as AccountProvider,
    //             t.contractAddress
    //         );
    //         if (vol24hObj[key] === undefined) {
    //             return null;
    //         } else if (vol24hObj[key] === "does_not_exist") {
    //             return {
    //                 ...t,
    //                 vol24h: null,
    //             };
    //         } else if (vol24hObj[key] !== "does_not_exist") {
    //             return {
    //                 ...t,
    //                 vol24h: vol24hObj[key] as number,
    //             };
    //         } else return null;
    //     })
    //     .filter(
    //         // only get the ones that we got the market cap for
    //         hasValue
    //     );
    // await algolia.tokens.save(updatedTokens);
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
