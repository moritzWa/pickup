import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    hasValue,
    Maybe,
    NotFoundError,
    success,
    UnexpectedError,
} from "src/core/logic";
import axios, { AxiosError } from "axios";
import axiosRetry from "axios-retry";
import { config } from "src/config";
import { Datadog } from "../datadog";
import { Tags } from "hot-shots";
import { DateTime } from "luxon";
import { chunk, create, orderBy } from "lodash";
import {
    CoinGeckoCoinData,
    CoingeckoDEXLineChartPoint,
    CoingeckoDEXData,
    CoingeckoDEXOHLCV,
    CoingeckoDEXPriceInfo,
    CoingeckoOHLCV,
    CoingeckoPoolDEX,
    CoinGeckoSearchResults,
    CoinGeckoSearchTrendingResults,
    CoingeckoSimpleDEXPrice,
    CoinGeckoTokenId,
    CoinListInfo,
    CoingeckoDEXCandlestickChartPoint,
} from "./types";
import { Helpers, wrapAxiosWithRetry } from "../helpers";
import { Slack, SlackChannel } from "../slack";
import { StatusCodes } from "http-status-codes";
import { redisHistoricalPricing } from "../cache";
import {
    getCoingeckoAssetPlatform,
    getCoingeckoForAccountProvider,
} from "./platforms";
import { Dictionary, keyBy } from "lodash";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { ChartType, Granularity } from "src/shared/domain";
import BigNumber from "bignumber.js";
// import { connect } from "src/core/infra/postgres";

const TIMEOUT = 20 * 1000;

const MAX_DEX_TOKEN_ADDRESSES = 30;

const client = axios.create({
    timeout: TIMEOUT,
    baseURL: "https://pro-api.coingecko.com/api/v3",
    params: {
        x_cg_pro_api_key: config.coingecko.apiKey,
    },
});

client.interceptors.response.use(function (response) {
    // if 429 => should throw so we can retry this
    if (response?.status === StatusCodes.TOO_MANY_REQUESTS) {
        response.status = 500;
        throw response;
    }

    return response;
});

wrapAxiosWithRetry(client, {
    // this way if we have to retry, the timeout resets to the above 15 seconds
    // we want this behavior
    shouldResetTimeout: true,
});

export type CoingeckoHistoricalData = {
    price: number;
    start: Date;
    end: Date;
};

export type CoingeckoHistoricalDataClosingPrice = {
    price: number;
    timestamp: Date;
};

export type CoingeckoOHLCPrice = {
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    timestamp: Date;
};

export type CoingeckoHistoricalDataParams = {
    startUtcSeconds: number;
    endUtcSeconds: number;
};

export type CurrentPriceDollarsResponseRawData = {
    usd: number; // dollars
    usd_24h_change: number; // percent ex. -3.12 which is -3.12%
    usd_24h_vol: number; // volume in dollars
    usd_market_cap: Maybe<number>; // dollars
};

export type CurrentPriceDollarsResponseData = {
    usd: number;
    usd24hChange: Maybe<number>;
    usd24hVol: Maybe<number>;
    usdMarketCap: Maybe<number>;
};

export type CurrentPriceDollarsResponseDataV2 = {
    coinGeckoId: string;
    usd: number;
    usd24hChange: number;
    usd24hVol: number;
    usdMarketCap: Maybe<number>;
};

export const chainToCoinGeckoTokenId = (
    blockchain: AccountProvider
): FailureOrSuccess<DefaultErrors, Maybe<CoinGeckoTokenId>> => {
    switch (blockchain) {
        case AccountProvider.Solana:
            return success(CoinGeckoTokenId.Solana);
        default:
            return failure(
                new Error("Could not find CoinGeckoTokenId for this blockchain")
            );
    }
};

// for some reason coingecko migrates some of the pricing in weird ways
export const _getOverrideAssetId = (assetId: string) => {
    if (assetId === "avalanche") {
        return "avalanche-2";
    }
    if (assetId === "bnb") {
        return "binancecoin";
    }
    // terra moved to a different symbol now
    if (assetId === "terrausd-wormhole") {
        return "terrausd";
    }
    if (assetId === "polygon") {
        return "matic-network";
    }
    return assetId;
};

export const getHistoricalData = async (
    _assetId: string,
    numberOfDays: number = 365
): Promise<FailureOrSuccess<DefaultErrors, CoingeckoHistoricalData[]>> => {
    try {
        const assetId = _getOverrideAssetId(_assetId);

        const { data } = await client.get<{ prices: [number, number][] }>(
            `/coins/${assetId}/market_chart`,
            {
                timeout: 15 * 1000,
                params: {
                    vs_currency: "usd",
                    days: numberOfDays,
                    interval: "daily",
                },
            }
        );

        const historical = data.prices.map(
            ([timestamp, price]): CoingeckoHistoricalData => ({
                price,
                start: DateTime.fromJSDate(new Date(timestamp))
                    .minus({ days: 1 })
                    .endOf("day")
                    .plus({ milliseconds: 1 })
                    .toJSDate(),
                end: DateTime.fromJSDate(new Date(timestamp))
                    .endOf("day")
                    .plus({ milliseconds: 1 })
                    .toJSDate(),
            })
        );

        recordOk();

        // force the order so code using this doesn't break
        return success(orderBy(historical, (t) => t.end, "asc"));
    } catch (err) {
        recordErr({ type: "unknown_error" });
        // console.error(err);

        // void Slack.send({
        //     channel: SlackChannel.Tokens,
        //     message: `Error getting historical data for ${_assetId}. Error: ${
        //         (err as any)?.message || "no message"
        //     }!`,
        // });

        if (err instanceof AxiosError) {
            Datadog.increment("coingecko.err", {
                status: err.response?.status?.toString() || "unknown",
            });

            if (err.response?.status === 404) {
                recordErr({ type: "pricing_no_exist", token: _assetId });

                return failure(
                    new NotFoundError("Coin not found.", {
                        type:
                            err.status === "404" ? "coin_no_exist" : "unknown",
                    })
                );
            }

            // void Slack.send({
            //     channel: SlackChannel.Tokens,
            //     message: `Error getting historical data for ${_assetId}. Error: ${
            //         (err as any)?.message || "no message"
            //     }!`,
            // });

            return failure(new UnexpectedError(err));
        }

        return failure(new UnexpectedError(err));
    }
};

export const getHistoricalDataForRange = async (
    _assetId: string,
    params: CoingeckoHistoricalDataParams
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        { data: CoingeckoHistoricalDataClosingPrice[]; coingeckoId: string }
    >
> => {
    try {
        const assetId = _getOverrideAssetId(_assetId);

        const { data } = await client.get<{ prices: [number, number][] }>(
            `/coins/${assetId}/market_chart/range`,
            {
                timeout: 15 * 1000,
                params: {
                    vs_currency: "usd",
                    from: params.startUtcSeconds,
                    to: params.endUtcSeconds,
                },
            }
        );

        const historical = data.prices.map(
            ([timestamp, price]): CoingeckoHistoricalDataClosingPrice => ({
                price,
                timestamp: new Date(timestamp),
            })
        );

        recordOk();

        const orderedHistoricalData = orderBy(
            historical,
            (t) => t.timestamp,
            "asc"
        );

        // force the order so code using this doesn't break
        return success({
            data: orderedHistoricalData,
            coingeckoId: assetId,
        });
    } catch (err) {
        recordErr({ type: "unknown_error" });
        // console.error(err);

        // void Slack.send({
        //     channel: SlackChannel.Tokens,
        //     message: `Error getting historical data for ${_assetId}. Error: ${
        //         (err as any)?.message || "no message"
        //     }!`,
        // });

        if (err instanceof AxiosError) {
            Datadog.increment("coingecko.err", {
                status: err.response?.status?.toString() || "unknown",
            });

            if (err.response?.status === 404) {
                recordErr({ type: "pricing_no_exist", token: _assetId });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            err.status === "404" ? "coin_no_exist" : "unknown",
                    })
                );
            }

            // void Slack.send({
            //     channel: SlackChannel.Tokens,
            //     message: `Error getting historical data for ${_assetId}. Error: ${
            //         (err as any)?.message || "no message"
            //     }!`,
            // });

            return failure(new UnexpectedError(err));
        }

        return failure(new UnexpectedError(err));
    }
};

export const getHistoricalDataOHLC = async (
    _assetId: string,
    params: CoingeckoHistoricalDataParams
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        { data: CoingeckoOHLCPrice[]; coingeckoId: string }
    >
> => {
    try {
        const assetId = _getOverrideAssetId(_assetId);

        const { data } = await client.get<
            [number, number, number, number, number][]
        >(`/coins/${assetId}/ohlc/range`, {
            timeout: 15 * 1000,
            params: {
                interval: "hourly", // TODO: hourly also?
                vs_currency: "usd",
                // from: params.startUtcSeconds,
                // to: params.endUtcSeconds,
            },
        });

        // console.log(data);

        // Open, High, Low, Close
        const historical = data.map(
            ([timestamp, open, high, low, close]): CoingeckoOHLCPrice => ({
                price: close,
                open,
                high,
                low,
                close,
                timestamp: new Date(timestamp),
            })
        );

        Datadog.increment("coingecko.historical_data.ok", 1);

        const orderedHistoricalData = orderBy(
            historical,
            (t) => t.timestamp,
            "asc"
        );

        // force the order so code using this doesn't break
        return success({
            data: orderedHistoricalData,
            coingeckoId: assetId,
        });
    } catch (err) {
        recordErr({ type: "unknown_error" });

        if (err instanceof AxiosError) {
            Datadog.increment("coingecko.err", {
                status: err.response?.status?.toString() || "unknown",
            });

            if (err.response?.status === 404) {
                recordErr({ type: "pricing_no_exist", token: _assetId });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            err.status === "404" ? "coin_no_exist" : "unknown",
                    })
                );
            }

            return failure(new UnexpectedError(err));
        }

        return failure(new UnexpectedError(err));
    }
};

const getPoolsForToken = async (
    provider: AccountProvider,
    contractAddress: string
): Promise<FailureOrSuccess<DefaultErrors, CoingeckoPoolDEX[]>> => {
    try {
        const platform = getCoingeckoAssetPlatform(provider);

        // https://api.geckoterminal.com/api/v2/networks/solana/tokens/7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3/pools?page=1
        const { data } = await client.get<{
            data: CoingeckoPoolDEX[];
        }>(`/onchain/networks/${platform}/tokens/${contractAddress}/pools`, {
            timeout: 15 * 1000,
            params: {
                page: 1,
            },
        });

        return success(data.data);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

const _setInCache = async (key: string, data: CoingeckoDEXOHLCV) => {
    await redisHistoricalPricing.set(key, JSON.stringify(data), "EX", 60 * 60);
};

const _getFromCache = async (
    key: string
): Promise<CoingeckoDEXOHLCV | null> => {
    const value = await redisHistoricalPricing.get(key);

    if (!value) {
        return null;
    }

    const data = Helpers.maybeParseJSON<CoingeckoDEXOHLCV>(value);

    if (data.isFailure()) {
        return null;
    }

    return data.value;
};

const getLineChartForPool = async (
    provider: AccountProvider,
    pool: CoingeckoPoolDEX,
    granularity: Granularity
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        { data: CoingeckoDEXOHLCV; points: CoingeckoDEXLineChartPoint[] }
    >
> => {
    try {
        const key = `cg:pool:${provider}:${pool.attributes.address}:${granularity}`;

        const createdAt = pool.attributes.pool_created_at
            ? new Date(pool.attributes.pool_created_at)
            : null;
        const { aggregate, timeframe } = _getTimeframeAndAggregate(
            granularity,
            createdAt
        );

        const { data } = await client.get<CoingeckoDEXOHLCV>(
            `/onchain/networks/${provider}/pools/${pool.attributes.address}/ohlcv/${timeframe}`,
            {
                params: {
                    currency: "USD",
                    aggregate,
                    limit: 1000, // FIXME:
                },
            }
        );

        recordOk();

        let points = data.data.attributes.ohlcv_list.map(
            (o): CoingeckoDEXLineChartPoint => ({
                timestamp: new Date(o[0] * 1000),
                closing: o[4],
                volume: o[5],
            })
        );

        if (points.length > 0) {
            Datadog.increment("coingecko.get_line_chart_for_pool.ok", 1, {
                pool_address: pool.attributes.address,
            });
        } else {
            Datadog.increment("coingecko.get_line_chart_for_pool.empty", 1, {
                pool_address: pool.attributes.address,
            });
        }

        const tryAndUserCache = !points.length;

        if (tryAndUserCache) {
            const curlRequest = `curl -X GET "https://pro-api.coingecko.com/api/v3/onchain/networks/${provider}/pools/${pool.attributes.address}/ohlcv/${timeframe}?currency=USD&aggregate=${aggregate}&limit=1000&x_cg_pro_api_key=${config.coingecko.apiKey}"`;

            console.log("CURL: " + curlRequest);
            // console.log(pool?.attributes?.address);
            // console.log(data.data.attributes);

            void Slack.send({
                channel: SlackChannel.Charts,
                format: true,
                message: [
                    `No chart data points for ${pool?.attributes?.address} ${pool?.relationships.base_token?.data?.id} -> ${pool?.relationships.quote_token?.data?.id}`,
                    `Points: ${points.length} points`,
                    `Granularity: ${granularity}`,
                    `Curl:\n\n${curlRequest}\n`,
                ].join("\n"),
            });

            // try to get from the cache and set the points to this
            const cachedData = await _getFromCache(key);

            if (cachedData) {
                points = (cachedData?.data?.attributes?.ohlcv_list ?? []).map(
                    (o): CoingeckoDEXLineChartPoint => ({
                        timestamp: new Date(
                            new BigNumber(o[0]).toNumber() * 1000
                        ),
                        closing: new BigNumber(o[4]).toNumber(),
                        volume: new BigNumber(o[5]).toNumber(),
                    })
                );

                console.log(`[points: ${points.length}]`);
            }
        }

        if (points.length) {
            void _setInCache(key, data);
        }

        // force the order so code using this doesn't break
        return success({
            data,
            points,
        });
    } catch (err) {
        recordErr({ type: "unknown_error" });
        // console.error(err);

        // void Slack.send({
        //     channel: SlackChannel.Tokens,
        //     message: `Error getting historical data for ${_assetId}. Error: ${
        //         (err as any)?.message || "no message"
        //     }!`,
        // });

        if (err instanceof AxiosError) {
            Datadog.increment("coingecko.err", {
                status: err.response?.status?.toString() || "unknown",
            });

            if (err.response?.status === 404) {
                recordErr({ type: "pricing_no_exist", pool_id: pool.id });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            err.status === "404" ? "coin_no_exist" : "unknown",
                    })
                );
            }

            // void Slack.send({
            //     channel: SlackChannel.Tokens,
            //     message: `Error getting historical data for ${_assetId}. Error: ${
            //         (err as any)?.message || "no message"
            //     }!`,
            // });

            return failure(new UnexpectedError(err));
        }

        return failure(new UnexpectedError(err));
    }
};

const getCandlestickChartForPool = async (
    provider: AccountProvider,
    pool: CoingeckoPoolDEX,
    granularity: Granularity
): Promise<
    FailureOrSuccess<
        DefaultErrors,
        { data: CoingeckoDEXOHLCV; points: CoingeckoDEXCandlestickChartPoint[] }
    >
> => {
    try {
        const createdAt = pool.attributes.pool_created_at
            ? new Date(pool.attributes.pool_created_at)
            : null;

        const { aggregate, timeframe } = _getTimeframeAndAggregate(
            granularity,
            createdAt
        );

        const { data } = await client.get<CoingeckoDEXOHLCV>(
            `/onchain/networks/${provider}/pools/${pool.attributes.address}/ohlcv/${timeframe}`,
            {
                timeout: 15 * 1000,
                params: {
                    currency: "usd",
                    aggregate,
                    limit: 1000, // FIXME:
                },
            }
        );

        recordOk();

        const points = data.data.attributes.ohlcv_list.map(
            (o: CoingeckoOHLCV): CoingeckoDEXCandlestickChartPoint => ({
                timestamp: new Date(o[0] * 1000),
                open: o[1],
                high: o[2],
                low: o[3],
                close: o[4],
                volume: o[5],
            })
        );

        // force the order so code using this doesn't break
        return success({
            data,
            points,
        });
    } catch (err) {
        recordErr({ type: "unknown_error" });

        if (err instanceof AxiosError) {
            Datadog.increment("coingecko.err", {
                status: err.response?.status?.toString() || "unknown",
            });
            if (err.response?.status === 404) {
                recordErr({ type: "pricing_no_exist", pool_id: pool.id });
                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            err.status === "404" ? "coin_no_exist" : "unknown",
                    })
                );
            }

            return failure(new UnexpectedError(err));
        }

        return failure(new UnexpectedError(err));
    }
};

export const _checkIfValidAsset = async (
    _assetId: string
): Promise<FailureOrSuccess<DefaultErrors, boolean>> => {
    const assetId = _getOverrideAssetId(_assetId);
    const key = `cg:valid:${assetId}`;

    try {
        // if there is a value in the cache -> it means it is a bad / stale asset
        const value = await redisHistoricalPricing.get(key);

        // if there is a value (good values have a TTL, bad values don't)

        if (value) {
            // just exhaustively match. bad = false. anything else = true
            // just a bit more readable this way
            if (value === "bad") return success(false);
            if (value === "good") return success(true);
            return success(true);
        }

        await client.get(`/coins/${assetId}`, {
            timeout: 15 * 1000,
        });

        recordOk();

        // set asset as good for 3 days. assets can transform from good -> bad
        // so we don't want this to be indefinite. but do want it to be set as valid for enough time
        // so we make sure not to do this API call which for some reason is super slow with coingecko
        await redisHistoricalPricing.set(key, "good", "EX", 3 * 24 * 60 * 60);

        // force the order so code using this doesn't break
        return success(true);
    } catch (err) {
        recordErr({ type: "unknown_error" });
        // console.error(err);

        // void Slack.send({
        //     channel: SlackChannel.Tokens,
        //     message: `Error getting historical data for ${_assetId}. Error: ${
        //         (err as any)?.message || "no message"
        //     }!`,
        // });

        if (err instanceof AxiosError) {
            Datadog.increment("coingecko.err", {
                status: err.response?.status?.toString() || "unknown",
            });

            if (err.response?.status === 404) {
                recordErr({ type: "pricing_no_exist", token: _assetId });

                // set for a day that this asset is bad
                // this doesn't have a TTL, so log to slack so can make sure not a mistake
                await redisHistoricalPricing.set(key, "bad");

                return failure(
                    new NotFoundError("Coin not found.", {
                        type:
                            err.status === "404" ? "coin_no_exist" : "unknown",
                    })
                );
            }

            // void Slack.send({
            //     channel: SlackChannel.Tokens,
            //     message: `Error getting historical data for ${_assetId}. Error: ${
            //         (err as any)?.message || "no message"
            //     }!`,
            // });

            return failure(new UnexpectedError(err));
        }

        return failure(new UnexpectedError(err));
    }
};

const getSimpleTokenPrice = async (
    provider: AccountProvider,
    contractAddresses: string[]
): Promise<
    FailureOrSuccess<DefaultErrors, Dictionary<CurrentPriceDollarsResponseData>>
> => {
    try {
        const response = await client.get(`/simple/token_price/${provider}`, {
            params: {
                id: provider,
                contract_addresses: contractAddresses,
                vs_currencies: "usd",
                include_market_cap: true,
                include_24hr_vol: true,
                include_24hr_change: true,
            },
        });

        const data: Dictionary<CurrentPriceDollarsResponseRawData> =
            response.data;

        const obj = Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = {
                usd: value.usd,
                usd24hChange: value.usd_24h_change,
                usd24hVol: value.usd_24h_vol,
                usdMarketCap: value.usd_market_cap,
            };

            return acc;
        }, {} as Record<string, CurrentPriceDollarsResponseData>);

        Datadog.increment("coingecko.simple_token_price.ok", 1);

        return success(obj);
    } catch (error) {
        Datadog.increment("coingecko.simple_token_price.err", 1);

        return failure(new UnexpectedError(error));
    }
};

const getCurrentPriceDollars = async (
    _tokenId: Maybe<string>
): Promise<
    FailureOrSuccess<DefaultErrors, CurrentPriceDollarsResponseData>
> => {
    try {
        if (!_tokenId) {
            return failure(new Error("No token id"));
        }

        const tokenId = _getOverrideAssetId(_tokenId);

        // make sure the token exists before doing the price
        // maybe add back later. making it so slow tho
        const coinInfoIsValidResponse = await _checkIfValidAsset(_tokenId);

        if (coinInfoIsValidResponse.isFailure()) {
            return failure(coinInfoIsValidResponse.error);
        }

        const isValid = coinInfoIsValidResponse.value;

        if (!isValid) {
            return failure(
                new NotFoundError("Could not find token.", {
                    type: "coin_no_exist",
                })
            );
        }

        const response = await client.get("/simple/price", {
            params: {
                vs_currencies: "usd",
                ids: [tokenId].join(","),
                include_24hr_vol: true,
                include_24hr_change: true,
                include_market_cap: true,
            },
        });

        // console.log("[API real-time price]");

        const data = response.data;

        if (!data[tokenId] || !data[tokenId].usd) {
            return failure(new Error("No price found"));
        }

        const values = data[tokenId];

        Datadog.increment("coingecko.current_price.ok", 1);

        return success({
            usd: values.usd,
            usd24hChange: values.usd_24h_change,
            usd24hVol: values.usd_24h_vol,
            usdMarketCap: values.usd_market_cap,
        });
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";

            if (error.response?.status === 404) {
                recordErr({ type: "pricing_no_exist", token: _tokenId || "" });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            error.status === "404"
                                ? "coin_no_exist"
                                : "unknown",
                    })
                );
            }
        }

        Datadog.increment("coingecko.current_price.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};

const getPriceDollars = async ({
    tokenId,
    contractAddress,
    provider,
}: {
    tokenId: Maybe<string>;
    contractAddress: Maybe<string>;
    provider: Maybe<AccountProvider>;
}): Promise<
    FailureOrSuccess<DefaultErrors, Maybe<CurrentPriceDollarsResponseData>>
> => {
    try {
        if (tokenId) {
            return getCurrentPriceDollars(tokenId);
        }

        // no info to get the pricing
        if (!provider || !contractAddress) {
            return success(null);
        }

        const dexPriceResponse = await getCurrentPriceDollarsFromDEX(provider, [
            contractAddress,
        ]);

        if (dexPriceResponse.isFailure()) {
            return failure(dexPriceResponse.error);
        }

        const dex = dexPriceResponse.value;

        if (dex.length !== 1) {
            return success(null);
        }

        const price = dex[0];

        const data: CurrentPriceDollarsResponseData = {
            usd: parseFloat(price.priceUsdDollars),
            usd24hChange: null,
            usd24hVol: null,
            usdMarketCap: null,
        };

        return success(data);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
};

const getCurrentPriceDollarsForIds = async (
    tokenIds: string[]
): Promise<
    FailureOrSuccess<DefaultErrors, CurrentPriceDollarsResponseDataV2[]>
> => {
    try {
        const response = await client.get<
            Record<string, CurrentPriceDollarsResponseRawData>
        >("/simple/price", {
            params: {
                vs_currencies: "usd",
                ids: tokenIds.map((t): string => t).join(","),
                include_24hr_vol: true,
                include_24hr_change: true,
                include_market_cap: true,
            },
        });

        Datadog.increment("coingecko.current_price_ids.ok", 1);

        return success(
            Object.entries(response.data).map(
                ([key, value]): CurrentPriceDollarsResponseDataV2 => ({
                    coinGeckoId: key,
                    usd: value.usd,
                    usd24hChange: value.usd_24h_change,
                    usd24hVol: value.usd_24h_vol,
                    usdMarketCap: value.usd_market_cap,
                })
            )
        );
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";

            if (error.response?.status === 404) {
                // recordErr({ type: "pricing_no_exist", token: _tokenId });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            error.status === "404"
                                ? "coin_no_exist"
                                : "unknown",
                    })
                );
            }
        }

        Datadog.increment("coingecko.current_price_ids.err", 1);

        return failure(new UnexpectedError(error));
    }
};

const getCoin = async (
    _tokenId: string
): Promise<FailureOrSuccess<DefaultErrors, CoinGeckoCoinData>> => {
    try {
        const tokenId = _getOverrideAssetId(_tokenId);

        const response = await client.get<CoinGeckoCoinData>(
            `/coins/${tokenId}`,
            {
                params: {
                    localization: false,
                    tickers: false,
                    market_data: false,
                    community_data: false,
                    developer_data: false,
                    sparkline: false,
                },
            }
        );

        // console.log("[API real-time price]");

        const data = response.data;

        Datadog.increment("coingecko.get_coin.ok", 1);

        return success(data);
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";

            if (error.response?.status === 404) {
                recordErr({ type: "coin_no_exist", token: _tokenId });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            error.status === "404"
                                ? "coin_no_exist"
                                : "unknown",
                    })
                );
            }
        }

        Datadog.increment("coingecko.get_coin.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};

const getBestPoolFromResp = (coingeckoDex: CoingeckoDEXData) => {
    const _bestPoolAddress =
        (coingeckoDex?.relationships?.top_pools?.data ?? [])[0]?.id || "";
    const bestPoolAddress = _bestPoolAddress.split("_")[1];
    return bestPoolAddress;
};

const getCoingeckoForContract = async (
    platform: string,
    contractAddress: string
): Promise<FailureOrSuccess<DefaultErrors, CoinGeckoCoinData>> => {
    try {
        const response = await client.get<CoinGeckoCoinData>(
            `/coins/${platform}/contract/${contractAddress}`
        );

        const data = response.data;

        Datadog.increment("coingecko.get_coin_from_contract.ok", 1);

        return success(data);
    } catch (error) {
        const tags = {};

        Datadog.increment("coingecko.get_coin_from_contract.err", 1, tags);

        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";

            if (error.response?.status === 404) {
                recordErr({ type: "coin_no_exist" });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            error.status === "404"
                                ? "coin_no_exist"
                                : "unknown",
                    })
                );
            }
        }

        return failure(new UnexpectedError(error));
    }
};

const getFullTokenList = async (): Promise<
    FailureOrSuccess<DefaultErrors, CoinListInfo[]>
> => {
    try {
        const response = await client.get<CoinListInfo[]>("/coins/list", {
            params: {
                include_platform: true,
            },
        });

        // console.log("[API real-time price]");

        const data = response.data;

        return success(data);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
};

const getSearchResults = async (
    search: string
): Promise<FailureOrSuccess<DefaultErrors, CoinGeckoSearchResults>> => {
    try {
        const response = await client.get<CoinGeckoSearchResults>("/search", {
            params: {
                query: search,
            },
        });

        const data = response.data;

        return success(data);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
};

const getSearchTrendingResults = async (): Promise<
    FailureOrSuccess<DefaultErrors, CoinGeckoSearchTrendingResults>
> => {
    try {
        const response = await client.get<CoinGeckoSearchTrendingResults>(
            "/search/trending",
            {
                // params: {},
            }
        );

        const data = response.data;

        return success(data);
    } catch (error) {
        return failure(new UnexpectedError(error));
    }
};

const getCurrentPriceDollarsFromDEX = async (
    provider: AccountProvider,
    contractAddresses: string[]
): Promise<FailureOrSuccess<DefaultErrors, CoingeckoDEXPriceInfo[]>> => {
    try {
        const platform = getCoingeckoAssetPlatform(provider);

        // coingecko only allows chunks of 30
        const chunks = chunk(contractAddresses, 30);
        const data: CoingeckoSimpleDEXPrice[] = [];

        for (const ch of chunks) {
            const response = await client.get<{
                data: CoingeckoSimpleDEXPrice;
            }>(
                `/onchain/simple/networks/${platform}/token_price/${ch.join(
                    ","
                )}`
            );

            data.push(response.data.data);
        }

        Datadog.increment("coingecko.current_price.dexes.ok", 1);

        // turn data into a big map of the tokenprices
        const tokenPrices = data.reduce<Record<string, string>>(
            (acc, curr) => ({
                ...acc,
                ...(curr.attributes.token_prices ?? {}),
            }),
            {}
        );

        return success(
            Object.entries(tokenPrices).map(
                ([key, value]): CoingeckoDEXPriceInfo => ({
                    contract: key,
                    provider,
                    priceUsdDollars: value,
                })
            )
        );
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";

            if (error.response?.status === 404) {
                recordErr({ type: "pricing_no_exist" });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            error.status === "404"
                                ? "coin_no_exist"
                                : "unknown",
                    })
                );
            }
        }

        Datadog.increment("coingecko.current_price_ids.err", 1);

        return failure(new UnexpectedError(error));
    }
};

const getTokenInfoFromDEX = async (
    provider: AccountProvider,
    contractAddresses: string
): Promise<FailureOrSuccess<DefaultErrors, CoingeckoDEXData>> => {
    try {
        const platform = getCoingeckoAssetPlatform(provider);

        const response = await client.get<{
            data: CoingeckoDEXData;
        }>(`/onchain/networks/${platform}/tokens/${contractAddresses}`);

        Datadog.increment("coingecko.token_info.dexes.ok", 1);

        return success(response.data.data);
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";

            if (error.response?.status === 404) {
                recordErr({ type: "pricing_no_exist" });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            error.status === "404"
                                ? "coin_no_exist"
                                : "unknown",
                    })
                );
            }
        }

        Datadog.increment("coingecko.token_info.dexes.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};

const getTokens = async (
    provider: AccountProvider,
    contractAddresses: string[]
): Promise<FailureOrSuccess<DefaultErrors, CoingeckoDEXData[]>> => {
    try {
        const platform = getCoingeckoAssetPlatform(provider);

        const chunks = chunk(contractAddresses, 30);
        const data: CoingeckoDEXData[] = [];

        for (const ch of chunks) {
            const response = await client.get<{
                data: CoingeckoDEXData[];
            }>(`/onchain/networks/${platform}/tokens/multi/${ch.join(",")}`);

            data.push(...response.data.data);
        }

        Datadog.increment("coingecko.multiple_tokens.dexes.ok", 1);

        return success(data);
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";

            if (error.response?.status === 404) {
                recordErr({ type: "pricing_no_exist" });

                return failure(
                    new NotFoundError("Could not find token.", {
                        type:
                            error.status === "404"
                                ? "coin_no_exist"
                                : "unknown",
                    })
                );
            }
        }

        Datadog.increment("coingecko.multiple_tokens.dexes.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};

const getPools = async (
    provider: AccountProvider,
    poolAddresses: string[]
): Promise<FailureOrSuccess<DefaultErrors, CoingeckoPoolDEX[]>> => {
    try {
        if (!poolAddresses.length) {
            return success([]);
        }

        const platform = getCoingeckoAssetPlatform(provider);

        const response = await client.get<{
            data: CoingeckoPoolDEX[];
        }>(
            `/onchain/networks/${platform}/pools/multi/${poolAddresses.join(
                ","
            )}`
        );

        Datadog.increment("coingecko.pools.dexes.ok", 1);

        return success(response.data.data);
    } catch (error) {
        debugger;

        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";

            if (error.response?.status === 404) {
                recordErr({ type: "pricing_no_exist" });

                return failure(
                    new NotFoundError("Could not find pool.", {
                        type:
                            error.status === "404"
                                ? "coin_no_exist"
                                : "unknown",
                    })
                );
            }
        }

        Datadog.increment("coingecko.pools.dexes.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};

const _getTimeframeAndAggregate = (
    granularity: Granularity,
    createdAt: Date | null
) => {
    let timeframe: "day" | "hour" | "minute" = "day";
    let aggregate: number = 1;

    if (granularity === Granularity.Hour) {
        timeframe = "minute";
        aggregate = 1;
    } else if (granularity === Granularity.Day) {
        timeframe = "minute";
        aggregate = 5;
    } else if (granularity === Granularity.Week) {
        timeframe = "hour";
        aggregate = 1;
    } else if (
        granularity === Granularity.Month ||
        granularity === Granularity.ThreeMonth ||
        granularity === Granularity.Year ||
        granularity === Granularity.YearToDate ||
        granularity === Granularity.All
    ) {
        // console.log("CREATED: " + pool.attributes.pool_created_at);
        // override depending on how old the pool is
        if (createdAt) {
            const now = new Date();
            const diff = now.getTime() - createdAt.getTime();
            const days = diff / (1000 * 60 * 60 * 24);

            if (days < 7) {
                timeframe = "minute";
                aggregate = 5;
            } else if (days < 30) {
                timeframe = "hour";
                aggregate = 1;
            }
        } else {
            timeframe = "day";
            aggregate = 1;
        }
    }

    return {
        timeframe,
        aggregate,
    };
};

const recordErr = (tags?: Tags) => Datadog.increment("coingecko.err", 1, tags);
const recordOk = (tags?: Tags) => Datadog.increment("coingecko.ok", 1, tags);

export const coingecko = {
    getTokenURL: (cgId: string) => `https://www.coingecko.com/en/coins/${cgId}`,
    getHistoricalData,
    getCoin,
    getHistoricalDataForRange,
    getCurrentPriceDollars,
    getFullTokenList,
    getCurrentPriceDollarsForIds,
    getCoingeckoForContract,
    getSimpleTokenPrice,
    getTokenInfoFromDEX,
    getCurrentPriceDollarsFromDEX,
    getHistoricalDataOHLC,
    getPriceDollars,
    getPoolsForToken,
    getLineChartForPool,
    getCandlestickChartForPool,
    getBestPoolFromResp,
    search: {
        getSearchResults,
        getSearchTrendingResults,
    },
    dex: {
        getTokens,
        getPools,
        MAX_ADDRESSES: MAX_DEX_TOKEN_ADDRESSES,
    },
};
