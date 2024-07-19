import { nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { analytics } from "src/utils/segment";
import * as crypto from "crypto";
import { config } from "src/config";
import { Maybe, success } from "src/core/logic";
import { isNil } from "lodash";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { CurrentPriceService } from "../../services/currentPriceService";
import BigNumber from "bignumber.js";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { Datadog, logHistogram } from "src/utils";

export const GetTokenPriceResponse = objectType({
    name: "GetTokenPriceResponse",
    definition(t) {
        t.nonNull.float("currentPriceCents");
        t.nonNull.string("currentPrice");
    },
});

export const getTokenPrice = queryField("getTokenPrice", {
    type: nonNull("GetTokenPriceResponse"),
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
            Datadog.increment("tokens.price.err", 1, {
                type: "get_integration",
            });
            throwIfError(tradingServiceResponse);
        }

        const tradingService = tradingServiceResponse.value;

        const tokenInfoResponse = await tradingService.getToken({
            contractAddress,
        });

        if (tokenInfoResponse.isFailure()) {
            Datadog.increment("tokens.price.err", 1, { type: "token_info" });
            throwIfError(tokenInfoResponse);
        }

        const tokenInfo = tokenInfoResponse.value;

        const start = Date.now();
        const priceResponse = await CurrentPriceService.getCurrentPrice(
            tokenInfo
        );

        // console.log(priceResponse);
        const end = Date.now();

        logHistogram({
            metric: "tokens.price.duration",
            value: end - start,
        });

        if (priceResponse.isFailure()) {
            Datadog.increment("tokens.price.err", 1, { type: "price" });

            throwIfError(priceResponse);
        }

        const price = priceResponse.value;

        const currentPrice = // if it is less tha 0.01, show 8 decimals otherwise just 2
            price.usd < 0.01
                ? new BigNumber(price.usd).toFixed(8)
                : new BigNumber(price.usd).toFixed(2);

        Datadog.increment("tokens.price.ok", 1);

        return {
            currentPriceCents: new BigNumber(price.usd)
                .multipliedBy(100)
                .toNumber(),
            currentPrice: currentPrice,
        };
    },
});
