import { Maybe } from "@graphql-tools/utils";
import BigNumber from "bignumber.js";
import { isNil, keyBy } from "lodash";
import { parallel } from "radash";
import { AccountProvider } from "src/core/infra/postgres/entities";
import {
    DefaultErrors,
    FailureOrSuccess,
    failure,
    success,
} from "src/core/logic";
import { coingecko } from "src/utils";
import { birdeye } from "src/utils/birdeye";
import { GetTokenOverviewResponseData } from "src/utils/birdeye/getTokenOverview";
import { redisPersisted } from "src/utils/cache";
import { CoingeckoDEXData } from "src/utils/coingecko/types";

export type MarketCapVolumeData = {
    contractAddress: string;
    provider: AccountProvider;
    marketCap: Maybe<string>;
    vol24h: Maybe<string>;
};

type TokenData = {
    contractAddress: string;
    provider: AccountProvider;
};

const _getBirdeyeDataForTokens = async (
    tokens: TokenData[]
): Promise<FailureOrSuccess<DefaultErrors, GetTokenOverviewResponseData[]>> => {
    const responses = await parallel(10, tokens, async (token) =>
        birdeye.getTokenOverview(
            token.provider,
            token.contractAddress,
            true,
            "marketCApVolumeService -> getBirdeyeDataForTokens()"
        )
    );

    const tokenOverviews = responses
        .filter((r) => r.isSuccess())
        .map((r) => r.value.data)
        .flat();

    return success(tokenOverviews);
};

const getMarketCapAndVolume = async (
    tokens: TokenData[]
): Promise<FailureOrSuccess<DefaultErrors, MarketCapVolumeData[]>> => {
    if (!tokens.length) {
        return success([]);
    }

    const provider = tokens[0].provider as AccountProvider;

    // get market caps
    const [cgResp, birdeyeResponse] = await Promise.all([
        coingecko.dex.getTokens(
            provider,
            tokens.map((t: { contractAddress: string }) => t.contractAddress)
        ),
        _getBirdeyeDataForTokens(tokens),
    ]);

    if (cgResp.isFailure()) {
        return failure(cgResp.error);
    }

    if (birdeyeResponse.isFailure()) {
        return failure(birdeyeResponse.error);
    }

    const birdeyeMapping = keyBy(
        birdeyeResponse.value,
        (t: GetTokenOverviewResponseData) => t.address
    );
    const coingeckoMapping = keyBy(cgResp.value, (t) => t.attributes.address);

    const data = await Promise.all(
        tokens.map(_getTokenInfo(coingeckoMapping, birdeyeMapping))
    );

    return success(data);
};

const _getTokenInfo =
    (
        coingeckoMapping: Record<string, CoingeckoDEXData>,
        birdeyeMapping: Record<string, GetTokenOverviewResponseData>
    ) =>
    async (t: TokenData): Promise<MarketCapVolumeData> => {
        const coingecko = coingeckoMapping[t.contractAddress];
        const birdeye = birdeyeMapping[t.contractAddress];

        const _marketCap = birdeye?.mc || coingecko?.attributes.market_cap_usd;
        const _vol24h =
            birdeye?.v24hUSD || coingecko?.attributes.volume_usd.h24;

        // use market cap / volume if present, otherwise fall back to cache
        const hasValidMarketCap =
            !isNil(_marketCap) && new BigNumber(_marketCap).isFinite();

        const marketCap = hasValidMarketCap
            ? _marketCap
            : await getCachedMarketCap(t.contractAddress);

        const hasValidVol24h =
            !isNil(_vol24h) && new BigNumber(_vol24h).isFinite();

        const vol24h = hasValidVol24h
            ? _vol24h
            : await getCachedVol(t.contractAddress);

        // just void set it so that if in the future we cannot look it up, at least have a cached value
        if (_marketCap) void setCachedMarketCap(t.contractAddress, _marketCap);
        if (_vol24h) void setCachedVol(t.contractAddress, _vol24h);

        return {
            contractAddress: t.contractAddress,
            provider: t.provider,
            marketCap: isNil(marketCap) ? null : marketCap.toString(),
            vol24h: isNil(vol24h) ? null : vol24h.toString(),
        };
    };

const setCached =
    (prefix: string) => async (token: string, mc: string | number | null) => {
        const key = `${prefix}:${token}`;

        if (!mc) return;

        await redisPersisted.set(key, mc.toString());
    };

const getCached =
    (prefix: string) =>
    async (token: string): Promise<string | null> => {
        const key = `${prefix}:${token}`;

        const val = await redisPersisted.get(key);

        if (!val) return null;
        const num = new BigNumber(val);
        if (num.isNaN()) return null;
        return num.toString();
    };

const setCachedMarketCap = setCached("mc");
const setCachedVol = setCached("vol");
const getCachedMarketCap = getCached("mc");
const getCachedVol = getCached("vol");

export const MarketCapVolumeService = {
    getMarketCapAndVolume,
};
