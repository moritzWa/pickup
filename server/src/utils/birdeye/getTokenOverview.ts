import {
    DefaultErrors,
    FailureOrSuccess,
    Maybe,
    UnexpectedError,
    failure,
    success,
} from "src/core/logic";
import { Datadog } from "../datadog";
import { AxiosError } from "axios";
import { client } from "./client";
import { Dictionary } from "lodash";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { redisPersisted } from "../cache";
import { Helpers } from "../helpers";

// 60 min for now
const CACHE_TTL_SECONDS = 60 * 60;

export type GetTokenOverviewResponseData = {
    address: string;
    decimals: number;
    symbol: string;
    name: string;
    logoURI: string;
    extensions: {
        coingeckoId: string | null;
        serumV3Usdc: string | null;
        serumV3Usdt: string | null;
        website: string | null;
        telegram: string | null;
        twitter: string | null;
        description: string | null;
        discord: string | null;
        medium: string | null;
    };

    liquidity: Maybe<number>;
    price: Maybe<number>;
    history30mPrice: Maybe<number>;
    priceChange30mPercent: Maybe<number>;
    history1hPrice: Maybe<number>;
    priceChange1hPercent: Maybe<number>;
    history2hPrice: Maybe<number>;
    priceChange2hPercent: Maybe<number>;
    history4hPrice: Maybe<number>;
    priceChange4hPercent: Maybe<number>;
    history6hPrice: Maybe<number>;
    priceChange6hPercent: Maybe<number>;
    history8hPrice: Maybe<number>;
    priceChange8hPercent: Maybe<number>;
    history12hPrice: Maybe<number>;
    priceChange12hPercent: Maybe<number>;
    history24hPrice: Maybe<number>;
    priceChange24hPercent: Maybe<number>;
    uniqueWallet30m: Maybe<number>;
    uniqueWalletHistory30m: Maybe<number>;
    uniqueWallet30mChangePercent: Maybe<number>;
    uniqueWallet1h: Maybe<number>;
    uniqueWalletHistory1h: Maybe<number>;
    uniqueWallet1hChangePercent: Maybe<number>;
    uniqueWallet2h: Maybe<number>;
    uniqueWalletHistory2h: Maybe<number>;
    uniqueWallet2hChangePercent: Maybe<number>;
    uniqueWallet4h: Maybe<number>;
    uniqueWalletHistory4h: Maybe<number>;
    uniqueWallet4hChangePercent: Maybe<number>;
    uniqueWallet6h: Maybe<number>;
    uniqueWalletHistory6h: Maybe<number>;
    uniqueWallet6hChangePercent: Maybe<number>;
    uniqueWallet8h: Maybe<number>;
    uniqueWalletHistory8h: Maybe<number>;
    uniqueWallet8hChangePercent: Maybe<number>;
    uniqueWallet12h: Maybe<number>;
    uniqueWalletHistory12h: Maybe<number>;
    uniqueWallet12hChangePercent: Maybe<number>;
    uniqueWallet24h: Maybe<number>;
    uniqueWalletHistory24h: Maybe<number>;
    uniqueWallet24hChangePercent: Maybe<number>;
    lastTradeUnixTime: Maybe<number>;
    lastTradeHumanTime: Maybe<string>;
    supply: Maybe<number>;
    mc: Maybe<number>;
    holder: Maybe<number>;
    trade30m: Maybe<number>;
    tradeHistory30m: Maybe<number>;
    trade30mChangePercent: Maybe<number>;
    sell30m: Maybe<number>;
    sellHistory30m: Maybe<number>;
    sell30mChangePercent: Maybe<number>;
    buy30m: Maybe<number>;
    buyHistory30m: Maybe<number>;
    buy30mChangePercent: Maybe<number>;
    v30m: Maybe<number>;
    v30mUSD: Maybe<number>;
    vHistory30m: Maybe<number>;
    vHistory30mUSD: Maybe<number>;
    v30mChangePercent: Maybe<number>;
    vBuy30m: Maybe<number>;
    vBuy30mUSD: Maybe<number>;
    vBuyHistory30m: Maybe<number>;
    vBuyHistory30mUSD: Maybe<number>;
    vBuy30mChangePercent: Maybe<number>;
    vSell30m: Maybe<number>;
    vSell30mUSD: Maybe<number>;
    vSellHistory30m: Maybe<number>;
    vSellHistory30mUSD: Maybe<number>;
    vSell30mChangePercent: Maybe<number>;
    trade1h: Maybe<number>;
    tradeHistory1h: Maybe<number>;
    trade1hChangePercent: Maybe<number>;
    sell1h: Maybe<number>;
    sellHistory1h: Maybe<number>;
    sell1hChangePercent: Maybe<number>;
    buy1h: Maybe<number>;
    buyHistory1h: Maybe<number>;
    buy1hChangePercent: Maybe<number>;
    v1h: Maybe<number>;
    v1hUSD: Maybe<number>;
    vHistory1h: Maybe<number>;
    vHistory1hUSD: Maybe<number>;
    v1hChangePercent: Maybe<number>;
    vBuy1h: Maybe<number>;
    vBuy1hUSD: Maybe<number>;
    vBuyHistory1h: Maybe<number>;
    vBuyHistory1hUSD: Maybe<number>;
    vBuy1hChangePercent: Maybe<number>;
    vSell1h: Maybe<number>;
    vSell1hUSD: Maybe<number>;
    vSellHistory1h: Maybe<number>;
    vSellHistory1hUSD: Maybe<number>;
    vSell1hChangePercent: Maybe<number>;
    trade2h: Maybe<number>;
    tradeHistory2h: Maybe<number>;
    trade2hChangePercent: Maybe<number>;
    sell2h: Maybe<number>;
    sellHistory2h: Maybe<number>;
    sell2hChangePercent: Maybe<number>;
    buy2h: Maybe<number>;
    buyHistory2h: Maybe<number>;
    buy2hChangePercent: Maybe<number>;
    v2h: Maybe<number>;
    v2hUSD: Maybe<number>;
    vHistory2h: Maybe<number>;
    vHistory2hUSD: Maybe<number>;
    v2hChangePercent: Maybe<number>;
    vBuy2h: Maybe<number>;
    vBuy2hUSD: Maybe<number>;
    vBuyHistory2h: Maybe<number>;
    vBuyHistory2hUSD: Maybe<number>;
    vBuy2hChangePercent: Maybe<number>;
    vSell2h: Maybe<number>;
    vSell2hUSD: Maybe<number>;
    vSellHistory2h: Maybe<number>;
    vSellHistory2hUSD: Maybe<number>;
    vSell2hChangePercent: Maybe<number>;
    trade4h: Maybe<number>;
    tradeHistory4h: Maybe<number>;
    trade4hChangePercent: Maybe<number>;
    sell4h: Maybe<number>;
    sellHistory4h: Maybe<number>;
    sell4hChangePercent: Maybe<number>;
    buy4h: Maybe<number>;
    buyHistory4h: Maybe<number>;
    buy4hChangePercent: Maybe<number>;
    v4h: Maybe<number>;
    v4hUSD: Maybe<number>;
    vHistory4h: Maybe<number>;
    vHistory4hUSD: Maybe<number>;
    v4hChangePercent: Maybe<number>;
    vBuy4h: Maybe<number>;
    vBuy4hUSD: Maybe<number>;
    vBuyHistory4h: Maybe<number>;
    vBuyHistory4hUSD: Maybe<number>;
    vBuy4hChangePercent: Maybe<number>;
    vSell4h: Maybe<number>;
    vSell4hUSD: Maybe<number>;
    vSellHistory4h: Maybe<number>;
    vSellHistory4hUSD: Maybe<number>;
    vSell4hChangePercent: Maybe<number>;
    trade6h: Maybe<number>;
    tradeHistory6h: Maybe<number>;
    trade6hChangePercent: Maybe<number>;
    sell6h: Maybe<number>;
    sellHistory6h: Maybe<number>;
    sell6hChangePercent: Maybe<number>;
    buy6h: Maybe<number>;
    buyHistory6h: Maybe<number>;
    buy6hChangePercent: Maybe<number>;
    v6h: Maybe<number>;
    v6hUSD: Maybe<number>;
    vHistory6h: Maybe<number>;
    vHistory6hUSD: Maybe<number>;
    v6hChangePercent: Maybe<number>;
    vBuy6h: Maybe<number>;
    vBuy6hUSD: Maybe<number>;
    vBuyHistory6h: Maybe<number>;
    vBuyHistory6hUSD: Maybe<number>;
    vBuy6hChangePercent: Maybe<number>;
    vSell6h: Maybe<number>;
    vSell6hUSD: Maybe<number>;
    vSellHistory6h: Maybe<number>;
    vSellHistory6hUSD: Maybe<number>;
    vSell6hChangePercent: Maybe<number>;
    trade8h: Maybe<number>;
    tradeHistory8h: Maybe<number>;
    trade8hChangePercent: Maybe<number>;
    sell8h: Maybe<number>;
    sellHistory8h: Maybe<number>;
    sell8hChangePercent: Maybe<number>;
    buy8h: Maybe<number>;
    buyHistory8h: Maybe<number>;
    buy8hChangePercent: Maybe<number>;
    v8h: Maybe<number>;
    v8hUSD: Maybe<number>;
    vHistory8h: Maybe<number>;
    vHistory8hUSD: Maybe<number>;
    v8hChangePercent: Maybe<number>;
    vBuy8h: Maybe<number>;
    vBuy8hUSD: Maybe<number>;
    vBuyHistory8h: Maybe<number>;
    vBuyHistory8hUSD: Maybe<number>;
    vBuy8hChangePercent: Maybe<number>;
    vSell8h: Maybe<number>;
    vSell8hUSD: Maybe<number>;
    vSellHistory8h: Maybe<number>;
    vSellHistory8hUSD: Maybe<number>;
    vSell8hChangePercent: Maybe<number>;
    trade12h: Maybe<number>;
    tradeHistory12h: Maybe<number>;
    trade12hChangePercent: Maybe<number>;
    sell12h: Maybe<number>;
    sellHistory12h: Maybe<number>;
    sell12hChangePercent: Maybe<number>;
    buy12h: Maybe<number>;
    buyHistory12h: Maybe<number>;
    buy12hChangePercent: Maybe<number>;
    v12h: Maybe<number>;
    v12hUSD: Maybe<number>;
    vHistory12h: Maybe<number>;
    vHistory12hUSD: Maybe<number>;
    v12hChangePercent: Maybe<number>;
    vBuy12h: Maybe<number>;
    vBuy12hUSD: Maybe<number>;
    vBuyHistory12h: Maybe<number>;
    vBuyHistory12hUSD: Maybe<number>;
    vBuy12hChangePercent: Maybe<number>;
    vSell12h: Maybe<number>;
    vSell12hUSD: Maybe<number>;
    vSellHistory12h: Maybe<number>;
    vSellHistory12hUSD: Maybe<number>;
    vSell12hChangePercent: Maybe<number>;
    trade24h: Maybe<number>;
    tradeHistory24h: Maybe<number>;
    trade24hChangePercent: Maybe<number>;
    sell24h: Maybe<number>;
    sellHistory24h: Maybe<number>;
    sell24hChangePercent: Maybe<number>;
    buy24h: Maybe<number>;
    buyHistory24h: Maybe<number>;
    buy24hChangePercent: Maybe<number>;
    v24h: Maybe<number>;
    v24hUSD: Maybe<number>;
    vHistory24h: Maybe<number>;
    vHistory24hUSD: Maybe<number>;
    v24hChangePercent: Maybe<number>;
    vBuy24h: Maybe<number>;
    vBuy24hUSD: Maybe<number>;
    vBuyHistory24h: Maybe<number>;
    vBuyHistory24hUSD: Maybe<number>;
    vBuy24hChangePercent: Maybe<number>;
    vSell24h: Maybe<number>;
    vSell24hUSD: Maybe<number>;
    vSellHistory24h: Maybe<number>;
    vSellHistory24hUSD: Maybe<number>;
    vSell24hChangePercent: Maybe<number>;
    watch: Maybe<number>;
    view30m: Maybe<number>;
    viewHistory30m: Maybe<number>;
    view30mChangePercent: Maybe<number>;
    view1h: Maybe<number>;
    viewHistory1h: Maybe<number>;
    view1hChangePercent: Maybe<number>;
    view2h: Maybe<number>;
    viewHistory2h: Maybe<number>;
    view2hChangePercent: Maybe<number>;
    view4h: Maybe<number>;
    viewHistory4h: Maybe<number>;
    view4hChangePercent: Maybe<number>;
    view6h: Maybe<number>;
    viewHistory6h: Maybe<number>;
    view6hChangePercent: Maybe<number>;
    view8h: Maybe<number>;
    viewHistory8h: Maybe<number>;
    view8hChangePercent: Maybe<number>;
    view12h: Maybe<number>;
    viewHistory12h: Maybe<number>;
    view12hChangePercent: Maybe<number>;
    view24h: Maybe<number>;
    viewHistory24h: Maybe<number>;
    view24hChangePercent: Maybe<number>;
    uniqueView30m: Maybe<number>;
    uniqueViewHistory30m: Maybe<number>;
    uniqueView30mChangePercent: Maybe<number>;
    uniqueView1h: Maybe<number>;
    uniqueViewHistory1h: Maybe<number>;
    uniqueView1hChangePercent: Maybe<number>;
    uniqueView2h: Maybe<number>;
    uniqueViewHistory2h: Maybe<number>;
    uniqueView2hChangePercent: Maybe<number>;
    uniqueView4h: Maybe<number>;
    uniqueViewHistory4h: Maybe<number>;
    uniqueView4hChangePercent: Maybe<number>;
    uniqueView6h: Maybe<number>;
    uniqueViewHistory6h: Maybe<number>;
    uniqueView6hChangePercent: Maybe<number>;
    uniqueView8h: Maybe<number>;
    uniqueViewHistory8h: Maybe<number>;
    uniqueView8hChangePercent: Maybe<number>;
    uniqueView12h: Maybe<number>;
    uniqueViewHistory12h: Maybe<number>;
    uniqueView12hChangePercent: Maybe<number>;
    uniqueView24h: Maybe<number>;
    uniqueViewHistory24h: Maybe<number>;
    uniqueView24hChangePercent: Maybe<number>;
    numberMarkets: Maybe<number>;
};

type GetTokenOverviewResponse = {
    data: GetTokenOverviewResponseData;
    success: boolean;
};

export const getTokenOverview = async (
    provider: AccountProvider,
    address: string,
    canUseCache: boolean,
    location: string
): Promise<FailureOrSuccess<DefaultErrors, GetTokenOverviewResponse>> => {
    try {
        const cacheKey = `bird:${provider}_${address}`;

        if (canUseCache) {
            const cachedData = await redisPersisted.get(cacheKey);

            if (cachedData) {
                const response =
                    Helpers.maybeParseJSON<GetTokenOverviewResponse>(
                        cachedData
                    );

                if (response.isSuccess() && response.value) {
                    return success(response.value);
                }
            }
        }

        const response = await client.get("/defi/token_overview", {
            params: {
                address,
            },
        });

        if (response.status !== 200) {
            return failure(new Error("Failed to fetch token overview"));
        }

        if (response.data) {
            await redisPersisted.set(
                cacheKey,
                JSON.stringify(response.data),
                "EX",
                CACHE_TTL_SECONDS
            );
        }

        Datadog.increment("birdeye.get_token_overview.ok", 1, { location });

        return success(response.data);
    } catch (error) {
        const tags = {
            location,
        };
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";
        }

        Datadog.increment("birdeye.get_token_overview.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};
