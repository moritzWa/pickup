import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { SolanaDiscoveryProvider } from "../../../discovery/services/discoveryService/providers/solana/solana";
import {
    NexusGenObjects,
    NexusGenRootTypes,
} from "src/core/surfaces/graphql/generated/nexus";
import { isValidSolanaAddress } from "src/shared/integrations/providers/solana/utils";
import { DiscoverySplashCacheService } from "../../../discovery/services/discoverySplashCache";
import { Slack, SlackChannel, logHistogram, sumBigNumbers } from "src/utils";
import { birdeye } from "src/utils/birdeye";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { DiscoveryResultType } from "../../../discovery/graphql";
import { formatPrice } from "../../../discovery/services/discoveryService/providers/solana/utils";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { isNil, keyBy } from "lodash";
import { TOKEN_OVERRIDES } from "src/shared/integrations/providers/solana/contracts";
import {
    Category,
    categoryEnumToName,
    getCategoryBannerUrl,
    getCategoryDescription,
    getCategoryIconUrl,
    getCategoryMetadata,
    getCategorySlug,
    getTokenThumbnailIconImageUrl,
} from "src/core/infra/postgres/entities/Token";
import { CategoryEntryService } from "src/modules/categories/services/categoryService";
import { In } from "typeorm";
import { MarketCapVolumeService } from "src/modules/tokens/services/marketCapVolumeService";
import { connect } from "src/core/infra/postgres";
import { CategoriesCacheService } from "./categoriesCacheService";
import BigNumber from "bignumber.js";
import { enqueueFirebaseUpload } from "src/modules/tokens/services/enqueueFirebaseUpload";

type GetCategoryTokens = {
    bannerImageUrl?: string | null; // String
    categoryName: string; // String!
    description: string; // String!
    iconImageUrl?: string | null; // String
    slug: string; // String!
    tokens: NexusGenRootTypes["DiscoverySplashResult"][];
    totalMarketCap: BigNumber | null;
    totalVol24h: BigNumber | null;
    totalMarketCapChange: BigNumber | null;
    totalMarketCapChangePercentage: BigNumber | null;
    type: Category; // Category!
};

export const getCategories = async (): Promise<
    FailureOrSuccess<DefaultErrors, GetCategoryTokens[]>
> => {
    // united nations
    const resps = await Promise.all(
        Object.keys(Category).map((category) =>
            getCategoryTokens(Category[category as Category])
        )
    );
    if (resps.some((r) => r.isFailure())) {
        return failure(resps.find((r) => r.isFailure())!.error);
    }

    const successes = resps
        .map((r) => {
            if (r.isSuccess()) return r.value;
            return null;
        })
        .filter(hasValue);

    return success(successes);
};

export const getBestCategories = async (
    num: number
): Promise<FailureOrSuccess<DefaultErrors, GetCategoryTokens[]>> => {
    // get categories
    const categoriesResp = await getCategories();

    if (categoriesResp.isFailure()) {
        return failure(categoriesResp.error);
    }

    const categories = categoriesResp.value;

    // pick best
    const bestCategories = categories
        .filter((c) => c.tokens.length > 1)
        .sort((a, b) => {
            if (a.totalMarketCapChangePercentage === null) return 1;
            if (b.totalMarketCapChangePercentage === null) return -1;
            return b.totalMarketCapChangePercentage
                .minus(a.totalMarketCapChangePercentage)
                .toNumber();
        })
        .slice(0, num);

    return success(bestCategories);
};

export const getCategoryTokens = async (
    category: Category
): Promise<FailureOrSuccess<DefaultErrors, GetCategoryTokens>> => {
    // try pull from cache
    const cacheResponse = await CategoriesCacheService.fetch(category);
    if (cacheResponse.isFailure()) {
        void Slack.send({
            message:
                "Failed to fetch discovery splash cache: " +
                cacheResponse.error,
            channel: SlackChannel.TradingNever,
        });
    }
    if (cacheResponse.isSuccess() && cacheResponse.value) {
        return success(cacheResponse.value.data);
    }

    // get category tokens
    const categoryTokensResp = await getCategoryTokensWithoutCache(category);

    if (categoryTokensResp.isFailure()) {
        return failure(categoryTokensResp.error);
    }

    const categoryTokens = categoryTokensResp.value;

    // try set cache
    if (categoryTokens.slug) {
        const setCacheResponse = await CategoriesCacheService.set(
            category,
            categoryTokens
        );
        if (setCacheResponse.isFailure()) console.error(setCacheResponse.error);
    }

    return success(categoryTokens);
};

export const getCategoryTokensWithoutCache = async (
    category: Category
): Promise<FailureOrSuccess<DefaultErrors, GetCategoryTokens>> => {
    // get category tokens
    const categoryTokensResp = await CategoryEntryService.find({
        where: {
            category: category,
        },
    });
    if (categoryTokensResp.isFailure())
        return failure(categoryTokensResp.error);
    const categoryTokens = categoryTokensResp.value;

    if (categoryTokens.length === 0)
        return success({
            categoryName: categoryEnumToName(category) || "",
            slug: getCategorySlug(category) || "",
            iconImageUrl: getCategoryIconUrl(getCategorySlug(category)),
            bannerImageUrl: getCategoryBannerUrl(getCategorySlug(category)),
            description:
                getCategoryDescription(getCategorySlug(category)) || "",
            tokens: [],
            type: category,
            totalMarketCap: new BigNumber(0),
            totalVol24h: new BigNumber(0),
            totalMarketCapChange: new BigNumber(0),
            totalMarketCapChangePercentage: new BigNumber(0),
        });

    // get tokens
    const tokensResp = await TokenService.find({
        where: {
            id: In(categoryTokens.map((t) => t.tokenId)),
        },
    });
    if (tokensResp.isFailure()) return failure(tokensResp.error);
    const tokens = tokensResp.value;
    const tokenByAddress = keyBy(tokens, (t) => t.contractAddress);

    // get prices
    const addresses = tokens
        .map((token) => token.contractAddress)
        .filter(hasValue);

    // prices & missing metadata
    const [pricesResponse, metadatasResponse, marketCapResponse] =
        await Promise.all([
            birdeye.getMultiPrice(addresses),
            TokenMetadataService.getTokenMetadatas(
                addresses.map((a) => ({
                    provider: AccountProvider.Solana,
                    contractAddress: a,
                }))
            ),
            MarketCapVolumeService.getMarketCapAndVolume(tokens),
        ]);

    if (metadatasResponse.isFailure()) return failure(metadatasResponse.error);

    const marketCapMapping = marketCapResponse.isSuccess()
        ? keyBy(marketCapResponse.value, (t) => t.contractAddress)
        : {};

    const metadatas = metadatasResponse.value;
    const metadatasObj = keyBy(metadatas, "contractAddress");

    // merge prices
    const prices = pricesResponse.isSuccess() ? pricesResponse.value : {};

    const t: NexusGenRootTypes["DiscoverySplashResult"][] = addresses
        .map((t): Maybe<NexusGenRootTypes["DiscoverySplashResult"]> => {
            const priceData = prices[t];
            const marketCap = marketCapMapping[t];

            const token = tokenByAddress[t];
            const metadata = metadatasObj[t];

            const iconImageUrl =
                token?.iconImageUrl || metadata.iconImageUrl || "";

            if (token && !token.hasAddedToCdn) {
                void enqueueFirebaseUpload(token, iconImageUrl);
            }

            if (!priceData || !metadata) return null;

            return {
                id: token.id,
                marketCap: marketCap?.marketCap,
                vol24h: marketCap?.vol24h,
                priceFormatted: formatPrice(priceData.value),
                priceChangePercentage24h: priceData.priceChange24h,
                priceChangePercentage24hFormatted: priceData.priceChange24h
                    ? `${priceData.priceChange24h.toFixed(2)}%`
                    : null,
                contractAddress: t,
                type: DiscoveryResultType.FungibleToken,
                provider: AccountProvider.Solana,
                name: token?.name || metadata.name || "",
                symbol: token?.symbol || metadata.symbol || "",
                iconImageUrl:
                    getTokenThumbnailIconImageUrl(token) || iconImageUrl,
                isStrict: token.isStrict,
                isMovementVerified: token.isMovementVerified,
                isClaimed: token.isClaimed,
            };
        })
        .filter(hasValue);

    // override metadatas
    t.forEach((t) => {
        const override = TOKEN_OVERRIDES[t.contractAddress];
        if (override) {
            t.symbol = override.symbol;
            t.iconImageUrl = override.iconImageUrl;
        }
    });

    // sort by percentage 24h change
    t.sort((a, b) => {
        if (!a.priceChangePercentage24h && !b.priceChangePercentage24h)
            return 0;
        if (!a.priceChangePercentage24h) return 1;
        if (!b.priceChangePercentage24h) return -1;
        return b.priceChangePercentage24h - a.priceChangePercentage24h;
    });

    const totalMarketCap = sumBigNumbers(
        t.map((token) => new BigNumber(token.marketCap ?? 0))
    );

    const totalVol24h = sumBigNumbers(
        t.map((token) => new BigNumber(token.vol24h ?? 0))
    );

    // Factor in the percentage change based on the market cap of the coin to get the overall
    // change for the category
    const totalMarketCapChange = t.reduce((acc, token) => {
        const marketCap = new BigNumber(token.marketCap ?? 0);
        const marketCapChangePercentage = new BigNumber(
            token.priceChangePercentage24h ?? 0
        ).div(100);

        const marketCapChange = marketCap.times(marketCapChangePercentage);
        return acc.plus(marketCapChange);
    }, new BigNumber(0));

    const totalMarketCapChangePercentage = totalMarketCapChange
        .div(totalMarketCap)
        .times(100);

    // build response
    const metadata = getCategoryMetadata(category);
    const resp = {
        categoryName: metadata.categoryName,
        slug: metadata.slug || "",
        iconImageUrl: metadata.iconImageUrl,
        bannerImageUrl: metadata.bannerImageUrl,
        description: metadata.description,
        type: metadata.type,
        tokens: t,
        totalMarketCap, // totalMarketCap.toString(),
        totalVol24h, // totalVol24h.toString(),
        totalMarketCapChange, // : totalMarketCapChange.toString(),
        totalMarketCapChangePercentage, // :
        // totalMarketCapChangePercentage.toString(),
    };

    return success(resp);
};

// run this script if file is called
if (require.main === module) {
    void connect().then(async () => {
        await getCategoryTokens(Category.UnitedNations);
    });
}
