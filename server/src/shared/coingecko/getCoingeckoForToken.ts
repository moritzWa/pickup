import {
    DefaultErrors,
    FailureOrSuccess,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { coingecko } from "src/utils";
import { redisHistoricalPricing, redisPersisted } from "src/utils/cache";

const CACHE_PREFIX = `coingecko:contract_mapping:v1`;

export const getCoingeckoForToken = async (
    provider: string,
    contractAddress: string
): Promise<FailureOrSuccess<DefaultErrors, string>> => {
    try {
        const cacheKey = `${CACHE_PREFIX}:${provider}:${contractAddress}`;

        const coingeckoId = await redisPersisted.get(cacheKey);

        if (coingeckoId) {
            return success(coingeckoId);
        }

        const coingeckoCoinInfoResponse =
            await coingecko.getCoingeckoForContract(provider, contractAddress);

        if (coingeckoCoinInfoResponse.isFailure()) {
            return failure(coingeckoCoinInfoResponse.error);
        }

        const coinInfo = coingeckoCoinInfoResponse.value;

        await redisHistoricalPricing.set(cacheKey, coinInfo.id);

        return success(coinInfo.id);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};
