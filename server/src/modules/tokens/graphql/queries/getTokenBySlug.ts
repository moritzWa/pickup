import { nonNull, queryField, stringArg } from "nexus";
import { Context } from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { tokenRepo } from "src/modules/trading/infra/postgres";

export const getTokenBySlug = queryField("getTokenBySlug", {
    type: nonNull("TokenInfo"),
    args: {
        slug: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { slug } = args;

        const tokenResponse = await tokenRepo.findBySlug(slug);

        throwIfError(tokenResponse);

        const token = tokenResponse.value;

        const tradingServiceResponse = TradingIntegrationService.getIntegration(
            token.provider
        );

        throwIfError(tradingServiceResponse);

        const tradingService = tradingServiceResponse.value;

        const tokenInfoResponse = await tradingService.getToken({
            contractAddress: token.contractAddress,
        });

        throwIfError(tokenInfoResponse);

        const tokenInfo = tokenInfoResponse.value;

        const gqlToken: NexusGenObjects["TokenInfo"] = {
            symbol: tokenInfo.symbol,
            contractAddress: tokenInfo.contractAddress,
            name: tokenInfo.name,
            iconImageUrl: tokenInfo.iconImageUrl,
            provider: tokenInfo.provider,
            isStrict: tokenInfo.isStrict,
            tokenId: tokenInfo.tokenId,
            isMovementVerified: tokenInfo.isMovementVerified,
        };

        return gqlToken;
    },
});
