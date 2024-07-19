import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    hasValue,
    success,
} from "src/core/logic";
import { SolanaDiscoveryProvider } from "./providers/solana/solana";
import {
    NexusGenObjects,
    NexusGenRootTypes,
} from "src/core/surfaces/graphql/generated/nexus";
import { birdeye } from "src/utils/birdeye";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { DiscoveryResultType } from "../../graphql";
import { formatPrice } from "./providers/solana/utils";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { TokenMetadataService } from "src/modules/tokens/services/tokenMetadataService/tokenMetadataService";
import { isNil, keyBy } from "lodash";
import BigNumber from "bignumber.js";
import { TOKEN_OVERRIDES } from "src/shared/integrations/providers/solana/contracts";
import { In, IsNull, Not } from "typeorm";
import { enqueueFirebaseUpload } from "src/modules/tokens/services/enqueueFirebaseUpload";
import { getTokenThumbnailIconImageUrl } from "src/core/infra/postgres/entities/Token";

export const getTrending = async (): Promise<
    FailureOrSuccess<
        DefaultErrors,
        NexusGenRootTypes["DiscoverySplashResult"][]
    >
> => {
    // get blacklisted tokens
    const blacklistResp = await TokenService.getBlacklist();
    if (blacklistResp.isFailure()) return failure(blacklistResp.error);
    const blacklistObj = blacklistResp.value;

    // build response with birdeye
    const tokenListResponse = await birdeye.getTokenList();
    if (tokenListResponse.isFailure()) return failure(tokenListResponse.error);
    const tokenList = tokenListResponse.value;
    const tokens = tokenList.tokens
        .map((t): NexusGenObjects["DiscoverySplashResult"] => ({
            id: t.address,
            coinGeckoTokenId: null,
            contractAddress: t.address,
            iconImageUrl: t.logoURI || "",
            name: t.name || "",
            provider: AccountProvider.Solana,
            symbol: t.symbol || "",
            type: DiscoveryResultType.FungibleToken,
            priceChangePercentage24h: null,
            priceChangePercentage24hFormatted: null,
            priceFormatted: null,
        }))
        .filter((t) => t.symbol && t.name) // otherwise shows as empty row
        .filter(
            (t) =>
                t.contractAddress !==
                "So11111111111111111111111111111111111111112"
        )
        .filter(
            (t) =>
                // filter blacklist
                !blacklistObj[
                    TokenService.buildKey(
                        t.provider as AccountProvider,
                        t.contractAddress
                    )
                ]
        );
    const addresses = tokens.map((t) => t.contractAddress);

    // prices & missing metadata
    const [pricesResponse, metadatasResponse, tokensResponse] =
        await Promise.all([
            birdeye.getMultiPrice(addresses),
            TokenMetadataService.getTokenMetadatas(
                tokens
                    .filter((a) => !a.name || !a.symbol || !a.iconImageUrl)
                    .map((a) => ({
                        provider: AccountProvider.Solana,
                        contractAddress: a.contractAddress,
                    }))
            ),
            TokenService.find({
                where: {
                    contractAddress: In(addresses),
                },
            }),
        ]);

    const ourTokens = tokensResponse.isSuccess()
        ? keyBy(tokensResponse.value, (t) => t.contractAddress)
        : {};

    // merge prices
    if (pricesResponse.isFailure()) return failure(pricesResponse.error);
    const prices = pricesResponse.value;
    tokens.forEach((t) => {
        const priceData = prices[t.contractAddress];
        if (priceData) {
            t.priceFormatted = formatPrice(priceData.value);
            t.priceChangePercentage24h = priceData.priceChange24h;
            t.priceChangePercentage24hFormatted =
                t.priceChangePercentage24hFormatted = t.priceChangePercentage24h
                    ? `${t.priceChangePercentage24h.toFixed(2)}%`
                    : null;
        }
    });

    // merge metadatas
    if (metadatasResponse.isSuccess()) {
        // don't throw failure if it failed
        const metadatas = metadatasResponse.value || [];
        const metadatasByKey = metadatas.reduce((acc, m) => {
            acc[TokenService.buildKey(m.provider, m.contractAddress)] = m;
            return acc;
        }, {});
        tokens.forEach((token) => {
            const metadata =
                metadatasByKey[
                    TokenService.buildKey(
                        AccountProvider.Solana,
                        token.contractAddress
                    )
                ];
            if (metadata) {
                token.name = metadata.name || "";
                token.symbol = metadata.symbol || "";
                token.iconImageUrl = metadata.iconImageUrl || "";
            }
        });
    }

    tokens.forEach((t) => {
        const ourToken = ourTokens[t.contractAddress];

        if (!ourToken) return;
        if (!ourToken.cdnThumbnailImageUrl && !ourToken.iconImageUrl) return;

        if (ourToken && !ourToken.hasAddedToCdn) {
            void enqueueFirebaseUpload(
                ourToken,
                ourToken.iconImageUrl || t.iconImageUrl
            );
        }

        t.iconImageUrl =
            getTokenThumbnailIconImageUrl(ourToken) || t.iconImageUrl;
    });

    // override metadatas
    tokens.forEach((t) => {
        const override = TOKEN_OVERRIDES[t.contractAddress];
        if (override) {
            t.symbol = override.symbol;
            t.iconImageUrl = override.iconImageUrl;
        }
    });

    const allowedTokens = tokens.filter((t) => {
        if (isNil(t.priceChangePercentage24h)) return true;
        const isNegative100 = new BigNumber(t.priceChangePercentage24h)
            .dp(2)
            .eq(-100);
        if (isNegative100) return false;
        return true;
    });

    return success(allowedTokens);
};
