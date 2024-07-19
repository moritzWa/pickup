import { Token } from "src/shared/integrations/types";
import {
    CurrentPriceDollarsResponseData,
    Datadog,
    coingecko,
    logHistogram,
    trackErr,
    trackOk,
} from "src/utils";
import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    failure,
    success,
} from "src/core/logic";
import { isNil } from "lodash";
import BigNumber from "bignumber.js";
import { TradingIntegrationService } from "src/shared/integrations";

export type AssetPricePoint = {
    timestamp: Date; // number;
    utcTimeSeconds: number;
    valueCents: Maybe<BigNumber>;
    value: Maybe<BigNumber>;
    open: Maybe<BigNumber>;
    close: Maybe<BigNumber>;
    high: Maybe<BigNumber>;
    low: Maybe<BigNumber>;
};

const getCurrentPrice = async (
    token: Token
): Promise<
    FailureOrSuccess<DefaultErrors, CurrentPriceDollarsResponseData>
> => {
    if (
        token.chartProvider === "coingecko" &&
        token.contractAddress &&
        token.provider
    ) {
        return _getCurrentPriceFromCoingeckoDEX(token);
    }

    if (token.chartProvider === "coingecko" && token.coingeckoTokenId) {
        return _getCurrentPriceFromCoingecko(token);
    }

    return failure(new Error("Current price is not supported."));
};

const _getCurrentPriceFromCoingecko = async (
    token: Token
): Promise<
    FailureOrSuccess<DefaultErrors, CurrentPriceDollarsResponseData>
> => {
    const coingeckoId = token.coingeckoTokenId;

    if (!coingeckoId) {
        return failure(new Error("Coingecko doesn't exist."));
    }

    const start = Date.now();

    const currentPriceResponse = await coingecko.getCurrentPriceDollars(
        coingeckoId
    );

    if (currentPriceResponse.isFailure()) {
        trackErr({
            metric: "portfolio.current_price.err",
            err: currentPriceResponse.error,
            tags: { type: "coingecko_prices" },
        });

        return failure(currentPriceResponse.error);
    }

    const end = Date.now();
    const diffMs = end - start;

    logHistogram({
        metric: "portfolio.current_price.duration",
        value: diffMs,
        tags: { coingeckoId },
    });

    trackOk("portfolio.current_price.success", 1);

    const currentPrice = currentPriceResponse.value;

    return success(currentPrice);
};

const _getCurrentPriceFromCoingeckoDEX = async (
    token: Token
): Promise<
    FailureOrSuccess<DefaultErrors, CurrentPriceDollarsResponseData>
> => {
    const start = Date.now();

    const currentPriceResponse = await coingecko.getCurrentPriceDollarsFromDEX(
        token.provider,
        [token.contractAddress]
    );

    if (currentPriceResponse.isFailure()) {
        trackErr({
            metric: "portfolio.current_price.err",
            err: currentPriceResponse.error,
            tags: { type: "coingecko_prices" },
        });

        return failure(currentPriceResponse.error);
    }

    const end = Date.now();
    const diffMs = end - start;

    const prices = currentPriceResponse.value;

    if (!prices.length) {
        return failure(new Error("No prices found"));
    }

    const currentPrice = prices[0];

    return success({
        usd: parseFloat(currentPrice.priceUsdDollars),
        usd24hChange: null,
        usd24hVol: null,
        usdMarketCap: null,
    });
};

export const CurrentPriceService = {
    getCurrentPrice,
};
