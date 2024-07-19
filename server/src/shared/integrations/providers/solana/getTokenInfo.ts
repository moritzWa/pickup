import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { TokenOverviewData } from "../../types";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { birdeye } from "src/utils/birdeye";
import { coingecko } from "src/utils";
import { getTokenSecurity } from "./getTokenSecurity";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { CategoryEntryService } from "src/modules/categories/services/categoryService";
import {
    IsFreezeableEnum,
    MemecoinLinkType,
    categoryEnumToName,
} from "src/core/infra/postgres/entities/Token";
import { FeedPostService } from "src/modules/feeds/services/feedPostService";
import { getToken } from "./getToken";
import { connect } from "src/core/infra/postgres";
import { pgTokenRepo } from "src/modules/tokens/postgres";
import { DexScreenerService } from "src/utils/dexscreener";
import { getTokenWarning } from "src/modules/tokens/services/getTokenWarning";
import { writeFileSync } from "fs";
import BigNumber from "bignumber.js";

const PROVIDER = AccountProvider.Solana;

export const getTokenInfo = async (
    contractAddress: string
): Promise<FailureOrSuccess<DefaultErrors, TokenOverviewData>> => {
    const [
        tokenOverviewResp,
        tokenSecurityResp,
        coingeckoContractResp,
        tokensDBResp,
        coingeckoDexResp,
    ] = await Promise.all([
        birdeye.getTokenOverview(
            PROVIDER,
            contractAddress,
            false,
            "solana > getTokenInfo"
        ),
        getTokenSecurity(contractAddress),
        coingecko.getCoingeckoForContract(PROVIDER, contractAddress),
        TokenService.findOne({
            where: {
                provider: PROVIDER,
                contractAddress,
            },
            relations: {
                categories: true,
            },
        }),
        coingecko.dex.getTokens(PROVIDER, [contractAddress]),
    ]);
    // if (tokenOverviewResp.isFailure()) return failure(tokenOverviewResp.error); <- birdeye outage 06/08. Must be optional
    // if (tokenSecurityResp.isFailure()) return failure(tokenSecurityResp.error); <- birdeye outage 06/08. Must be optional
    if (tokensDBResp.isFailure()) return failure(tokensDBResp.error);
    // if (coingeckoContractResp.isFailure()) <- fails for too many coins, unreliable
    //     return failure(coingeckoContractResp.error);

    const tokenOverview = tokenOverviewResp.isSuccess()
        ? tokenOverviewResp.value.data
        : undefined;
    const tokenSecurity = tokenSecurityResp.isSuccess()
        ? tokenSecurityResp.value
        : undefined;
    const coingeckoContract = coingeckoContractResp.isSuccess()
        ? coingeckoContractResp.value
        : null;
    const tokensDB = tokensDBResp.value;

    // get number of mentions
    const numMentionsResp = await FeedPostService.count({
        where: {
            tokenId: tokensDB.id,
        },
    });

    let bestLpPoolAddress = tokensDB.bestLpPoolAddress;

    if (!bestLpPoolAddress) {
        if (coingeckoDexResp.isSuccess()) {
            const coingeckoDex = coingeckoDexResp.value[0];
            const bestPoolAddress = coingecko.getBestPoolFromResp(coingeckoDex);

            if (bestPoolAddress) {
                // update the token
                await pgTokenRepo.update(tokensDB.id, {
                    bestLpPoolAddress: bestPoolAddress,
                });

                bestLpPoolAddress = bestPoolAddress;
            }
        }
    }

    const freezeable =
        tokensDB.isFreezeable === IsFreezeableEnum.Yes
            ? true
            : tokensDB.isFreezeable === IsFreezeableEnum.No
            ? false
            : tokenSecurity?.freezeable ?? null;
    const top10UserPercent = tokenSecurity?.top10UserPercent;
    const coingeckoDex = coingeckoDexResp.isSuccess()
        ? coingeckoDexResp.value[0]
        : null;
    const liquidity =
        (tokenOverview && hasValue(tokenOverview.liquidity)
            ? new BigNumber(tokenOverview.liquidity || 0)
            : null) || // coingecko updog's liquidity (total_reserve) was wrong so we need to use birdeye
        new BigNumber(coingeckoDex?.attributes?.total_reserve_in_usd ?? 0);

    const warningInfo = getTokenWarning({
        contractAddress: tokensDB.contractAddress,
        provider: tokensDB.provider,
        freezeable,
        top10UserPercent: top10UserPercent ?? null,
        isBlacklisted: tokensDB.isBlacklisted,
    });

    // add default links if unclaimed
    tokensDB.moreLinks = tokensDB.isClaimed
        ? tokensDB.moreLinks
        : TokenService.addDefaultLinks(
              tokensDB.contractAddress,
              tokensDB.moreLinks
          );
    // append links to more links
    const dexScreenerLink = `${DexScreenerService.getDexScreenerURL()}/${bestLpPoolAddress}`;
    if (
        dexScreenerLink &&
        tokensDB.moreLinks.every((l) => l.type !== MemecoinLinkType.DexScreener)
    ) {
        tokensDB.moreLinks = tokensDB.moreLinks.concat({
            type: MemecoinLinkType.DexScreener,
            url: dexScreenerLink,
            alwaysShow: true,
        });
    }
    // website
    const websiteLink =
        tokensDB.websiteLink || tokenOverview?.extensions?.website || "";
    if (
        websiteLink &&
        tokensDB.moreLinks.every((l) => l.type !== MemecoinLinkType.Website)
    ) {
        tokensDB.moreLinks = tokensDB.moreLinks.concat({
            type: MemecoinLinkType.Website,
            url: websiteLink,
            alwaysShow: true,
        });
    }
    // telegram
    const telegramLink =
        tokensDB.telegramLink || tokenOverview?.extensions?.telegram;
    if (
        telegramLink &&
        tokensDB.moreLinks.every((l) => l.type !== MemecoinLinkType.Telegram)
    ) {
        tokensDB.moreLinks = tokensDB.moreLinks.concat({
            type: MemecoinLinkType.Telegram,
            url: telegramLink,
            alwaysShow: true,
        });
    }
    // twitter
    const twitterLink =
        tokensDB.twitterLink || tokenOverview?.extensions?.twitter;
    if (
        twitterLink &&
        tokensDB.moreLinks.every((l) => l.type !== MemecoinLinkType.Twitter)
    ) {
        tokensDB.moreLinks = tokensDB.moreLinks.concat({
            type: MemecoinLinkType.Twitter,
            url: twitterLink,
            alwaysShow: true,
        });
    }

    // append dex screener link to always show (if it doesn't already exist)

    // writeFileSync("birdeye.json", JSON.stringify(tokenOverview, null, 2));

    const data: TokenOverviewData = {
        address: contractAddress,
        provider: PROVIDER,
        bestLpPoolAddress: bestLpPoolAddress,
        about: {
            description:
                tokensDB.description ||
                coingeckoContract?.description?.en ||
                null,
            address: contractAddress,
            links: {
                coingecko: tokenOverview?.extensions?.coingeckoId ?? null,
                website: websiteLink || null,
                telegram: telegramLink || null,
                twitter: twitterLink || null,
                discord: tokenOverview?.extensions?.discord ?? null,
                medium: tokenOverview?.extensions?.medium ?? null,
                dexscreener: dexScreenerLink || null,
            },
            moreLinks: tokensDB.moreLinks?.map((t) => t) || [],
            categories: tokensDB.categories || [],
            bannerUrl: tokensDB.bannerUrl,
            holder: tokenOverview?.holder ?? null,
            numMentions: numMentionsResp.isFailure()
                ? null
                : numMentionsResp.value,
            isClaimed: tokensDB.isClaimed,
            irlName: tokensDB.irlName,
        },
        stats: {
            marketCap: tokenOverview?.mc ?? null,
            v24hUSD: tokenOverview?.v24hUSD ?? null,
            liquidity: !liquidity.isZero() ? liquidity.toNumber() : null,
            buys24h: tokenOverview?.buy24h ?? null,
            sells24h: tokenOverview?.sell24h ?? null,
            trades24h: tokenOverview?.trade24h ?? null,
            traders24h: tokenOverview?.uniqueWallet24h ?? null,
            isLiquidityLocked: null,
        },
        security: {
            creationTime: tokenSecurity?.creationTime ?? null,
            mintTime: tokenSecurity?.mintTime ?? null,
            freezeable,
            top10HolderPercent: tokenSecurity?.top10HolderPercent ?? null,
            top10UserPercent: tokenSecurity?.top10UserPercent ?? null,
            showTop10: true,
            warning: warningInfo,
        },
    };

    return success(data);
};

if (require.main === module) {
    connect()
        .then(async () => {
            const response = await getToken({
                contractAddress: "3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN",
            });

            console.log(response);
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
