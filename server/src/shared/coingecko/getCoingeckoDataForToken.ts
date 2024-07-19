import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { getCoingeckoForToken } from "./getCoingeckoForToken";
import { redisHistoricalPricing, redisPersisted } from "src/utils/cache";
import { Helpers, coingecko } from "src/utils";
import { CoinGeckoCoinData } from "src/utils/coingecko/types";

const CACHE_PREFIX = `coingecko:token_data:v1`;

export const getCoingeckoDataForToken = async (
    provider: string,
    contractAddress: string
): Promise<FailureOrSuccess<DefaultErrors, CoinGeckoCoinData>> => {
    try {
        const coingeckoIdResponse = await getCoingeckoForToken(
            provider,
            contractAddress
        );

        if (coingeckoIdResponse.isFailure()) {
            return failure(coingeckoIdResponse.error);
        }

        const coingeckoId = coingeckoIdResponse.value;
        const cacheKey = `${CACHE_PREFIX}:${coingeckoId}`;

        const data = await redisPersisted.get(cacheKey);

        if (data) {
            const parsedData = Helpers.maybeParseJSON<CoinGeckoCoinData>(data);

            if (parsedData.isSuccess() && parsedData.value) {
                return success(parsedData.value);
            }
        }

        const coingeckoCoinInfoResponse = await coingecko.getCoin(coingeckoId);

        if (coingeckoCoinInfoResponse.isFailure()) {
            return failure(coingeckoCoinInfoResponse.error);
        }

        const coinInfo = coingeckoCoinInfoResponse.value;

        await redisHistoricalPricing.set(cacheKey, JSON.stringify(coinInfo));

        return success(coinInfo);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};
