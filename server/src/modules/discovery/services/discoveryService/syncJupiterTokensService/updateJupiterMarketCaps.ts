import {
    FailureOrSuccess,
    DefaultErrors,
    success,
    failure,
    failureAndLog,
    hasValue,
    Maybe,
} from "src/core/logic";
import { algolia } from "src/utils/algolia";
import { DiscoveryJupiterTokensCacheService } from "../discoveryJupiterTokensCache";
import {
    JupTokenWithStrictTag,
    fetchJupiterTokensWithoutCache,
} from "../providers/solana/jupiter";
import { AccountProvider, Token } from "src/core/infra/postgres/entities";
import { Dictionary } from "lodash";
import { DateTime } from "luxon";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { coingecko, logHistogram } from "src/utils";
import { IoT1ClickDevicesService } from "aws-sdk";
import BigNumber from "bignumber.js";
import { In } from "typeorm";

const NUM_UPDATES = 3000; // sums up to 20 coingecko requests

type MarketCapsEntry = {
    fdv: number;
    vol24h: number;
};

type MarketCapsDict = Dictionary<
    | {
          fdv: number;
          vol24h: number;
      }
    | "does_not_exist"
>;

export const updateJupiterMarketCaps = async (
    contractAddresses?: string[]
): Promise<FailureOrSuccess<DefaultErrors, number>> => {
    const start = Date.now();

    // fetch algolia tokens
    const algoliaTokensResp = await TokenService.find({
        where:
            contractAddresses && contractAddresses.length > 0
                ? {
                      contractAddress: In(contractAddresses),
                  }
                : undefined,
    });
    if (algoliaTokensResp.isFailure()) return failure(algoliaTokensResp.error);
    const algoliaTokens = algoliaTokensResp.value;

    // console.log(
    //     algoliaTokens.filter((t) => t.fdvDNE === null).length,
    //     "tokens with no market cap data"
    // );

    // filter the most important ones to update market cap for
    const tokensToUpdate = _prioritizeTokenUpdate(algoliaTokens);

    // get market caps
    const marketCapsResp = await getMarketCaps(tokensToUpdate);
    if (marketCapsResp.isFailure()) return failure(marketCapsResp.error);
    const marketCaps = marketCapsResp.value;

    // save to algolia
    const updatedTokens: Token[] = tokensToUpdate
        .map((t) => {
            const key = TokenService.buildKey(
                t.provider as AccountProvider,
                t.contractAddress
            );

            if (marketCaps[key] === undefined) {
                return null;
            } else if (marketCaps[key] === "does_not_exist") {
                return {
                    ...t,
                    fdv: null,
                    fdvUpdatedAtUnixStr: String(DateTime.now().toSeconds()),
                    fdvDNE: true,
                    vol24h: null,
                };
            } else if (marketCaps[key] !== "does_not_exist") {
                return {
                    ...t,
                    fdv: (marketCaps[key] as MarketCapsEntry).fdv,
                    fdvUpdatedAtUnixStr: String(DateTime.now().toSeconds()),
                    fdvDNE: false,
                    vol24h: (marketCaps[key] as MarketCapsEntry).vol24h,
                };
            }
        })
        .filter(
            // only get the ones that we got the market cap for
            hasValue
        );
    const updateDBResp = await TokenService.saveMany(updatedTokens);
    if (updateDBResp.isFailure()) return failure(updateDBResp.error);
    await algolia.tokens.save(
        updatedTokens.map((r) => ({
            ...r,
            objectID: r.contractAddress,
            provider: r.provider.toString(),
        }))
    );

    const end = Date.now();

    logHistogram({
        metric: "update_market_caps.duration",
        value: end - start,
        logIfOver: 30_000,
    });

    console.log(
        "successfully updated market caps for ",
        updatedTokens.length,
        " tokens"
    );

    return success(updatedTokens.length);
};

// filter the top we need: no market data > token created at > fdv updated at > fdv
/*
1. No market cap data stored in our DB gets first priority
2. Newer tokens get high priority
3. Higher market caps get medium priority
4. Low market cap coins created a while ago get low priority
*/
const _prioritizeTokenUpdate = (tokens: Token[]) => {
    // only look at tokens with createdAt
    const tokensWithCreatedAt = tokens.filter(
        (t) => t.tokenCreatedAtDNE === false && t.tokenCreatedAtUnixStr
    );

    // calculate number of tokens we want to update
    const numTokensToUpdate = NUM_UPDATES;
    let tokensToUpdate: Token[] = [];

    // prioritize the ones with no market cap data
    const noMarketCapData = tokensWithCreatedAt
        .filter((t) => t.fdvDNE === null)
        .slice(0, numTokensToUpdate - tokensToUpdate.length); // enforce max number of tokens to fetch
    tokensToUpdate = tokensToUpdate.concat(noMarketCapData);

    // calculate each token's importance using (tokenCreatedAt, fdvUpdatedAt, fdv)
    // see Engineering > Discovery Market Cap Sort: https://docs.google.com/document/d/1chw7Zs-sIbDAuPBGhhu-EiBFcH_zcYBKSJ2gLGQgHjA/edit
    const tokensWithImportance: (Token & { importance: number })[] =
        tokensWithCreatedAt
            .filter((t) => t.fdvDNE === false && t.fdv && t.fdvUpdatedAtUnixStr)
            .map((t) => {
                let importance = 0;

                // tokenCreatedAt
                const createdAtWeight = 1.5; // something created more recently we should update more often than a big market cap coin
                const daysCreatedAgo = DateTime.now().diff(
                    DateTime.fromSeconds(Number(t.tokenCreatedAtUnixStr!)),
                    "days"
                ).days;
                let createdAtImportance = 0;
                if (daysCreatedAgo <= 1)
                    createdAtImportance += 5 * createdAtWeight;
                else if (daysCreatedAgo <= 7)
                    createdAtImportance += 4 * createdAtWeight;
                else if (daysCreatedAgo <= 15)
                    createdAtImportance += 3 * createdAtWeight;
                else if (daysCreatedAgo <= 30)
                    createdAtImportance += 2 * createdAtWeight;
                else createdAtImportance += 0.5 * createdAtWeight;
                importance += createdAtImportance;

                // fdv
                const fdvWeight = 0.75;
                let fdvImportance = 0;
                if (t.fdv! <= 1_000_000) fdvImportance += 1 * fdvWeight;
                if (t.fdv! <= 10_000_000) fdvImportance += 2 * fdvWeight;
                if (t.fdv! <= 100_000_000) fdvImportance += 3 * fdvWeight;
                if (t.fdv! <= 1_000_000_000) fdvImportance += 4 * fdvWeight;
                else fdvImportance += 5 * fdvWeight;
                importance += fdvImportance;

                // fdvUpdatedAt - the importance of last update is dependent on when we last updated it.
                // If we updated it recently and it's a NEW token, we want to update it again. But if we updated it recently and it's an OLD token, then we don't need to update it again
                // can be negative
                const updatedAtWeight = 2;
                const hoursUpdatedAgo = DateTime.now().diff(
                    DateTime.fromSeconds(Number(t.fdvUpdatedAtUnixStr!)),
                    "hours"
                ).hours;
                let updatedAtImportance = 0;
                if (hoursUpdatedAgo <= 0.5 * 24)
                    updatedAtImportance +=
                        createdAtImportance - 5 * updatedAtWeight;
                if (hoursUpdatedAgo <= 1 * 24)
                    updatedAtImportance +=
                        createdAtImportance - 4 * updatedAtWeight;
                if (hoursUpdatedAgo <= 7 * 24)
                    updatedAtImportance +=
                        createdAtImportance - 3 * updatedAtWeight;
                if (hoursUpdatedAgo <= 30 * 24)
                    updatedAtImportance +=
                        createdAtImportance - 2 * updatedAtWeight;
                else
                    updatedAtImportance +=
                        createdAtImportance - 1 * updatedAtWeight;
                importance += updatedAtImportance;

                return {
                    ...t,
                    importance,
                };
            });

    // sort by importance in descending order
    tokensWithImportance.sort((a, b) => b.importance - a.importance);

    // take the top 10% (minus the number of tokens we already have)
    const topTokens = tokensWithImportance.slice(
        0,
        numTokensToUpdate - tokensToUpdate.length
    );
    tokensToUpdate = tokensToUpdate.concat(topTokens);

    return tokensToUpdate;
};

const getMarketCaps = async (
    tokens: {
        contractAddress: string;
    }[]
): Promise<FailureOrSuccess<DefaultErrors, MarketCapsDict>> => {
    const pages = Math.ceil(tokens.length / coingecko.dex.MAX_ADDRESSES);
    const marketCapsObj: MarketCapsDict = {};

    for (let i = 0; i < pages; i++) {
        const tokensPage = tokens
            .map((token) => token.contractAddress)
            .slice(
                i * coingecko.dex.MAX_ADDRESSES,
                (i + 1) * coingecko.dex.MAX_ADDRESSES
            );
        const marketCapsResp = await coingecko.dex.getTokens(
            AccountProvider.Solana,
            tokensPage
        );
        if (marketCapsResp.isFailure()) return failure(marketCapsResp.error);
        const marketCaps = marketCapsResp.value; // result excludes any missing tokens

        marketCaps.forEach((v) => {
            const key = TokenService.buildKey(
                AccountProvider.Solana,
                v.attributes.address
            );

            const fdv =
                v?.attributes?.fdv_usd !== null &&
                v?.attributes.fdv_usd !== undefined &&
                v?.attributes.fdv_usd !== "" // can't use market_cap_usd because not always available
                    ? BigNumber.min(
                          new BigNumber(v.attributes.fdv_usd).div(1000),
                          new BigNumber(Number.MAX_SAFE_INTEGER)
                      ).toNumber() // must divide by 1000 because market cap ints were causing overflow
                    : "does_not_exist";

            const vol24h =
                v?.attributes?.volume_usd.h24 !== null &&
                v?.attributes?.volume_usd.h24 !== undefined &&
                v?.attributes?.volume_usd.h24 !== ""
                    ? Math.floor(
                          new BigNumber(v.attributes.volume_usd.h24).toNumber()
                      )
                    : "does_not_exist";

            if (fdv !== "does_not_exist" && vol24h !== "does_not_exist") {
                marketCapsObj[key] = {
                    fdv,
                    vol24h,
                };
            }
        });

        // any ones that we couldn't pull the data for, label as "does not exist"
        tokensPage.forEach((contractAddress) => {
            const key = TokenService.buildKey(
                AccountProvider.Solana,
                contractAddress
            );
            if (marketCapsObj[key] === undefined)
                marketCapsObj[key] = "does_not_exist";
        });
    }
    return success(marketCapsObj);
};
