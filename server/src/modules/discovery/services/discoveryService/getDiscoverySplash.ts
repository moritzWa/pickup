import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { SolanaDiscoveryProvider } from "./providers/solana/solana";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { isValidSolanaAddress } from "src/shared/integrations/providers/solana/utils";
import { DiscoverySplashCacheService } from "../discoverySplashCache";
import { Slack, SlackChannel, logHistogram } from "src/utils";
import { birdeye } from "src/utils/birdeye";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { formatPrice } from "./providers/solana/utils";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { algolia } from "src/utils/algolia";
import { getBlueChips } from "./getBlueChips";
import { getTrending } from "./getTrending";
import { CategoryEntryService } from "src/modules/categories/services/categoryService";
import BigNumber from "bignumber.js";
import { isNil } from "lodash";
import { CompetitionService } from "src/modules/competitions/services";

const NUM_CATEGORIES_SHOW = 3;

export const getDiscoverySplash = async (): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenObjects["GetDiscoverySplashResponse"]
    >
> => {
    // try pull from cache
    const cacheResponse = await DiscoverySplashCacheService.fetch();
    if (cacheResponse.isFailure()) {
        void Slack.send({
            message:
                "Failed to fetch discovery splash cache: " +
                cacheResponse.error,
            channel: SlackChannel.TradingNever,
        });
    }
    if (cacheResponse.isSuccess() && cacheResponse.value) {
        const data = cacheResponse.value.data;

        return success({
            results: data.results,
            blueChips: data.blueChips,
            categories: data.categories.map((c) => ({
                ...c,
                totalMarketCap: c.totalMarketCap?.toNumber() ?? null,
                totalVol24h: c.totalVol24h?.toNumber() ?? null,
                totalMarketCapChange:
                    c.totalMarketCapChange?.toNumber() ?? null,
                totalMarketCapChangePercentage:
                    c.totalMarketCapChange?.toNumber() ?? null,
            })),
            competitions: data.competitions,
        });
    }

    // get blue chips | united nations | price-based trending feed
    const [blueChipsResp, categoriesResp, trendingResp, competitionsResp] =
        await Promise.all([
            getBlueChips(),
            CategoryEntryService.getBestCategories(NUM_CATEGORIES_SHOW),
            getTrending(),
            CompetitionService.getBestCompetitions(),
        ]);
    const blueChips = blueChipsResp.isFailure() ? [] : blueChipsResp.value;
    const categories = categoriesResp.isFailure() ? [] : categoriesResp.value;
    const results = trendingResp.isFailure() ? [] : trendingResp.value;
    const competitions = competitionsResp.isFailure()
        ? []
        : competitionsResp.value;

    // pick best categories

    // try set cache
    const setCacheResponse = await DiscoverySplashCacheService.set({
        results,
        blueChips,
        categories,
        competitions,
    });
    if (setCacheResponse.isFailure()) console.error(setCacheResponse.error);

    return success({
        results,
        blueChips,
        categories: categories.map((c) => ({
            ...c,
            totalMarketCap: c.totalMarketCap?.toNumber() ?? null,
            totalVol24h: c.totalVol24h?.toNumber() ?? null,
            totalMarketCapChange: c.totalMarketCapChange?.toNumber() ?? null,
            totalMarketCapChangePercentage:
                c.totalMarketCapChangePercentage?.toNumber() ?? null,
        })),
        competitions,
    });
};
