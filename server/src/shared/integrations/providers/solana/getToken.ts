import { Maybe, success } from "src/core/logic";
import { TradingIntegrationProviderService, Token } from "../../types";
import { coingecko, getHeliusCDNUrl, helius } from "src/utils";
import { connect } from "src/core/infra/postgres";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { getCoingeckoForToken } from "src/shared/coingecko/getCoingeckoForToken";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { WRAPPED_SOL_MINT } from "./constants";
import { CoinGeckoTokenId } from "src/utils/coingecko/types";
import { TOKEN_OVERRIDES } from "./contracts";
import { algolia } from "src/utils/algolia";
import { TokenService } from "src/modules/tokens/services/tokenService/tokenService";
import { writeFileSync } from "fs";
import { birdeye } from "src/utils/birdeye";
import { enqueueFirebaseUpload } from "src/modules/tokens/services/enqueueFirebaseUpload";
import { getTokenThumbnailIconImageUrl } from "src/core/infra/postgres/entities/Token";

const PROVIDER = AccountProvider.Solana;

export const getToken: TradingIntegrationProviderService["getToken"] = async ({
    contractAddress,
}) => {
    const [tokenInfoResponse, tokenResp] = await Promise.all([
        helius.tokens.metadataV2(contractAddress),
        TokenService.findOne({
            where: {
                provider: PROVIDER,
                contractAddress,
            },
        }),
    ]);
    throwIfError(tokenInfoResponse);
    // throwIfError(tokenResp);
    const tokenInfo = tokenInfoResponse.value;
    const isStrict = tokenResp.isSuccess() ? tokenResp.value.isStrict : false;
    const isMovementVerified = tokenResp.isSuccess()
        ? tokenResp.value.isMovementVerified
        : false;
    const isClaimed = tokenResp.isSuccess() ? tokenResp.value.isClaimed : false;

    const mintAddress = tokenInfo.id; // same as the contract address

    if (mintAddress === WRAPPED_SOL_MINT) {
        return success({
            symbol: "SOL",
            decimals: 9,
            createdAt: null,
            contractAddress: mintAddress,
            provider: PROVIDER,
            coingeckoTokenId: CoinGeckoTokenId.Solana,
            iconImageUrl: "https://assets.awaken.tax/icons/solana.png",
            name: "Solana",
            chartProvider: "coingecko",
            recommendedSlippageBps: 100,
            isStrict: isStrict,
            isMovementVerified: isMovementVerified,
            isClaimed: isClaimed,
            tokenId: tokenResp.value.id,
        });
    }

    const coingeckoIdResponse = await getCoingeckoForToken(
        PROVIDER,
        mintAddress
    );

    const coingeckoId = coingeckoIdResponse.isSuccess()
        ? coingeckoIdResponse.value
        : null;

    const override = TOKEN_OVERRIDES[mintAddress];

    const cdnUrl = getHeliusCDNUrl(tokenInfo);

    const birdeyeInfoResponse = await birdeye.getTokenSecurity(
        PROVIDER,
        mintAddress,
        true,
        "solana > getToken()"
    );

    // if it isn't indexed by coingecko, we don't want to fail
    const birdeyeInfo = birdeyeInfoResponse.isSuccess()
        ? birdeyeInfoResponse.value
        : null;

    const createdAt = birdeyeInfo?.creationTime
        ? new Date(parseFloat(birdeyeInfo.creationTime) * 1_000)
        : null;

    const iconImageUrl =
        override?.iconImageUrl ||
        tokenResp.value.iconImageUrl ||
        cdnUrl ||
        tokenInfo.content.links.image;

    if (tokenResp.value && !tokenResp.value.hasAddedToCdn) {
        void enqueueFirebaseUpload(tokenResp.value, iconImageUrl);
    }

    const token: Token = {
        symbol:
            override?.symbol ||
            tokenResp.value.symbol ||
            tokenInfo.token_info.symbol ||
            "",
        contractAddress: mintAddress || "",
        createdAt: createdAt,
        provider: PROVIDER,
        decimals: tokenInfo.token_info.decimals,
        coingeckoTokenId: coingeckoId,
        iconImageUrl:
            override?.iconImageUrl ||
            getTokenThumbnailIconImageUrl(tokenResp.value) ||
            iconImageUrl,
        name: tokenInfo?.content?.metadata?.name || tokenInfo.token_info.symbol,
        chartProvider: "coingecko", // always coingecko -> we'll use coingecko dex if we cannot get it
        // if coingecko, 0.5%. otherwise, 5%. can improve this over time
        recommendedSlippageBps: _getRecommendedSlippageBps(coingeckoId),
        isStrict: isStrict,
        isClaimed: isClaimed,
        isMovementVerified: tokenResp.value.isMovementVerified,
        tokenId: tokenResp.value.id,
    };

    return success(token);
};

const _getRecommendedSlippageBps = (coingeckoId: string | null) => {
    // for SOL and usdc -> low slippage
    if (
        coingeckoId === CoinGeckoTokenId.Solana ||
        coingeckoId === CoinGeckoTokenId.USDC
    ) {
        // kinda hacky way to set low slippage
        return 100;
    }

    // otherwise allow up to 5%
    return 1000;
};

if (require.main === module) {
    connect()
        .then(async () => {
            const response = await getToken({
                contractAddress: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
            });

            console.log(response);
        })
        .catch(console.error)
        .finally(() => process.exit(1));
}
