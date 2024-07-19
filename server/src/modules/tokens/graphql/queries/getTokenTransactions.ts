import { list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";

export const getTokenTransactions = queryField("getTokenTransactions", {
    type: nonNull(list(nonNull("Transaction"))),
    args: {
        provider: nonNull("AccountProviderEnum"),
        contractAddress: nonNull("String"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { provider, contractAddress } = args;

        const tradingServiceResponse = TradingIntegrationService.getIntegration(
            ACCOUNT_PROVIDER_GQL_TO_DOMAIN[provider]
        );

        throwIfError(tradingServiceResponse);

        const tradingService = tradingServiceResponse.value;

        const tokenInfoResponse = await tradingService.getToken({
            contractAddress,
        });

        throwIfError(tokenInfoResponse);

        const tokenInfo = tokenInfoResponse.value;

        const gqlToken: NexusGenObjects["TokenInfo"] = {
            symbol: tokenInfo.symbol,
            contractAddress: tokenInfo.contractAddress,
            name: tokenInfo.name,
            iconImageUrl: tokenInfo.iconImageUrl,
            provider: tokenInfo.provider,
            tokenId: tokenInfo.tokenId,
            isMovementVerified: tokenInfo.isMovementVerified,
        };

        return gqlToken;
    },
});
