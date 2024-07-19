import { nonNull, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { ApolloError } from "apollo-server-errors";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { TradingIntegrationService } from "src/shared/integrations";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";

export const DepositAddressResponse = objectType({
    name: "DepositAddressResponse",
    definition(t) {
        t.nonNull.string("publicAddress");
        t.nonNull.string("provider");
        t.nonNull.boolean("isFunded");
        t.nonNull.float("nativeAmount");
    },
});

export const getDepositAddress = queryField("getDepositAddress", {
    type: nonNull("DepositAddressResponse"),
    args: {
        provider: nonNull("AccountProviderEnum"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const { provider } = args;
        const user = ctx.me!;
        const issuer = user.magicIssuer;

        const tradingIntegrationResponse =
            TradingIntegrationService.getIntegration(
                ACCOUNT_PROVIDER_GQL_TO_DOMAIN[provider]
            );

        throwIfError(tradingIntegrationResponse);

        const tradingIntegration = tradingIntegrationResponse.value;

        const depositInfoResponse = await tradingIntegration.getDepositInfo(
            issuer
        );

        throwIfError(depositInfoResponse);

        const depositInfo = depositInfoResponse.value;

        return {
            publicAddress: depositInfo.publicAddress,
            isFunded: depositInfo.isFunded,
            provider: depositInfo.provider,
            nativeAmount: depositInfo.nativeBalance.toNumber(),
        };
    },
});
