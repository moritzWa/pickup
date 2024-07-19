import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { WatchlistAssetService } from "../../services/watchlistAssetService";
import { SolanaDiscoveryProvider } from "src/modules/discovery/services/discoveryService/providers/solana";
import { keyBy } from "lodash";
import { coingecko } from "src/utils";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { getPriceForCoingeckoDEX } from "src/modules/portfolio/services/portfolioService/pricingService";
import { formatPrice } from "src/modules/discovery/services/discoveryService/providers/solana/utils";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { where } from "lodash/fp";
import { In } from "typeorm";
import { getTokenThumbnailIconImageUrl } from "src/core/infra/postgres/entities/Token";

export const WatchlistAssetWithInfo = objectType({
    name: "WatchlistAssetWithInfo",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("contractAddress");
        t.nonNull.field("provider", { type: nonNull("AccountProviderEnum") });
        // info
        t.nullable.string("name");
        t.nullable.string("symbol");
        t.nullable.string("iconImageUrl");
        t.nullable.float("price");
        t.nullable.string("priceFormatted");
        t.nullable.float("priceChangePercentage24h");
        t.nullable.string("priceChangePercentage24hFormatted");
    },
});

export const getWatchlistAssetsForUser = queryField(
    "getWatchlistAssetsForUser",
    {
        type: nonNull(list(nonNull("WatchlistAssetWithInfo"))),
        resolve: async (_parent, args, ctx) => {
            throwIfNotAuthenticated(ctx);

            const user = ctx.me!;

            // get watchlist assets for user
            const watchlistAssetsResp = await WatchlistAssetService.findForUser(
                user.id
            );
            throwIfError(watchlistAssetsResp);
            const watchlistAssets = watchlistAssetsResp.value;

            // attach more info
            const infoResp =
                await SolanaDiscoveryProvider.jupiter.getJupiterTokens({
                    contractAddresses: watchlistAssets.map((wa) => ({
                        contractAddress: wa.contractAddress,
                    })),
                });
            throwIfError(infoResp);
            const info = infoResp.value;
            const infoByContract = keyBy(info, "contractAddress");

            const dexPricesResponse = await getPriceForCoingeckoDEX(
                watchlistAssets
            );

            const dexMapping = dexPricesResponse.isSuccess()
                ? keyBy(dexPricesResponse.value, (a) => a.contractAddress || "")
                : {};

            const tokensResponse = await TokenService.find({
                where: {
                    provider: AccountProvider.Solana,
                    contractAddress: In(
                        watchlistAssets.map((wa) => wa.contractAddress)
                    ),
                },
            });

            const allMetadata = tokensResponse.isSuccess()
                ? keyBy(tokensResponse.value, (v) => v.contractAddress)
                : {};

            // merge info into watchlist assets
            const watchlistAssetsWithInfo = watchlistAssets.map((wa) => {
                const tokenInfo = infoByContract[wa.contractAddress];
                const priceInfo = dexMapping[wa.contractAddress];
                const metadata = allMetadata[wa.contractAddress];

                return {
                    ...wa,
                    ...tokenInfo,
                    symbol: metadata?.symbol || tokenInfo?.symbol,
                    name: metadata?.name || tokenInfo?.name,
                    iconImageUrl:
                        getTokenThumbnailIconImageUrl(metadata) ||
                        tokenInfo?.iconImageUrl,
                    price: priceInfo?.priceCents?.div(100).toNumber() ?? 0,
                    priceFormatted: formatPrice(
                        priceInfo?.priceCents?.div(100).toNumber() ?? 0
                    ),
                    priceChangePercentage24h:
                        priceInfo?.dailyChangePercent?.toNumber(),
                    priceChangePercentage24hFormatted:
                        priceInfo?.dailyChangePercent
                            ? `${priceInfo.dailyChangePercent
                                  .multipliedBy(100)
                                  .toFixed(2)}%`
                            : null,
                    provider: wa.provider, // AccountProvider
                };
            });

            return watchlistAssetsWithInfo;
        },
    }
);
