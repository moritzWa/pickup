import { nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { isNil } from "lodash";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { MagicPortfolioService } from "src/modules/portfolio/services/portfolioService/magicPortfolioService";
import { getWalletTypeForMagic, magic } from "src/utils/magic";
import { ApolloError } from "apollo-server-errors";
import { WalletType } from "@magic-sdk/admin";
import { CostBasisService } from "src/modules/portfolio/services";
import { TokenService } from "../../services/tokenService/tokenService";
import { D } from "src/utils";
import { CurrencyCode } from "src/shared/domain";
import { TokenPnlService } from "src/modules/portfolio/services/tokenPnlService";
import BigNumber from "bignumber.js";

export const getTokenHolding = queryField("getTokenHolding", {
    type: nonNull("TokenPosition"),
    args: {
        provider: nonNull("AccountProviderEnum"),
        contractAddress: nonNull("String"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const { provider: _provider, contractAddress } = args;

        const provider = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_provider];

        if (!provider) {
            throw new ApolloError("Invalid blockchain.", "400");
        }

        const pnlResponse = await TokenPnlService.getPnl(
            user,
            provider,
            contractAddress
        );

        throwIfError(pnlResponse);

        const pnl = pnlResponse.value;

        const gqlPosition: NexusGenObjects["TokenPosition"] = {
            isNativeToken: pnl.position.isNativeToken,
            provider: pnl.position.provider,
            fiatAmountFormatted: D(
                new BigNumber(pnl.position.fiatAmountCents).toNumber(),
                CurrencyCode.USD
            ).toFormat(),
            contractAddress: pnl.position.contractAddress,
            fiatCurrency: pnl.position.fiatCurrency,
            iconImageUrl: pnl.position.iconImageUrl,
            symbol: pnl.position.symbol,
            fiatAmountCents: new BigNumber(
                pnl.position.fiatAmountCents
            ).toNumber(),
            amount: new BigNumber(pnl.position.amount).toNumber(),
            priceCents: new BigNumber(pnl.position.priceCents).toNumber(),
            avgCostBasisPerUnitCents: !pnl.doNotShowBasis
                ? pnl.costBasis.averagePurchasePriceCents
                    ? new BigNumber(
                          pnl.costBasis.averagePurchasePriceCents
                      )?.toNumber()
                    : null
                : null,
            avgCostBasisPerUnitFormatted: !pnl.doNotShowBasis
                ? pnl.avgCostBasisFiatAmountFormatted
                : null,
            totalCostBasisCents: !pnl.doNotShowBasis
                ? pnl.costBasis.currentCostBasisCents
                    ? new BigNumber(
                          pnl.costBasis.currentCostBasisCents
                      )?.toNumber()
                    : null
                : null,
            totalCostBasisFormatted:
                pnl.doNotShowBasis || isNil(pnl.costBasis.currentCostBasisCents)
                    ? null
                    : D(
                          new BigNumber(
                              pnl.costBasis.currentCostBasisCents
                          ).toNumber(),
                          CurrencyCode.USD
                      ).toFormat(),
            totalReturnFiatCents:
                pnl.doNotShowBasis || isNil(pnl.totalReturnFiatCents)
                    ? null
                    : pnl.totalReturnFiatCents
                    ? new BigNumber(pnl.totalReturnFiatCents).toNumber()
                    : null,
            totalReturnFiatFormatted: !pnl.doNotShowBasis
                ? pnl.totalReturnFormatted
                : null,
            totalReturnPercentage: !pnl.doNotShowBasis
                ? pnl.totalReturnPercentage
                : null,
            isPending: pnl.hasPendingSwaps,
        };

        return gqlPosition;
    },
});
