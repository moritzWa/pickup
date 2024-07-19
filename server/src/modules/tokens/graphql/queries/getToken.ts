import { nonNull, queryField } from "nexus";
import { Context } from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { Datadog } from "src/utils";
import { enqueueFirebaseUpload } from "../../services/enqueueFirebaseUpload";

export const getToken = queryField("getToken", {
    type: nonNull("TokenInfo"),
    args: {
        provider: nonNull("AccountProviderEnum"),
        contractAddress: nonNull("String"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { provider, contractAddress } = args;

        const tradingServiceResponse = TradingIntegrationService.getIntegration(
            ACCOUNT_PROVIDER_GQL_TO_DOMAIN[provider]
        );

        if (tradingServiceResponse.isFailure()) {
            Datadog.increment("api.get_token.err", {
                type: "get_integration",
            });

            throwIfError(tradingServiceResponse);
        }

        const tradingService = tradingServiceResponse.value;

        const tokenInfoResponse = await tradingService.getToken({
            contractAddress,
        });

        if (tokenInfoResponse.isFailure()) {
            Datadog.increment("api.get_token.err", {
                type: "get_token",
            });

            throwIfError(tokenInfoResponse);
        }

        const tokenInfo = tokenInfoResponse.value;

        // console.log("TOKEN INFO IS CLAIMED: ", tokenInfo.isClaimed);

        const gqlToken: NexusGenObjects["TokenInfo"] = {
            symbol: tokenInfo.symbol,
            contractAddress: tokenInfo.contractAddress,
            name: tokenInfo.name,
            iconImageUrl: tokenInfo.iconImageUrl,
            provider: tokenInfo.provider,
            isStrict: tokenInfo.isStrict,
            isClaimed: tokenInfo.isClaimed,
            tokenId: tokenInfo.tokenId,
            coingeckoId: tokenInfo.coingeckoTokenId,
            isMovementVerified: tokenInfo.isMovementVerified,
        };

        Datadog.increment("api.get_token_info.ok");

        return gqlToken;
    },
});
