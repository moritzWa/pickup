import { AccountProvider } from "src/core/infra/postgres/entities";
import { Maybe } from "src/core/logic";

// see coin_gecko_list.json for a list of ids
export enum CoinGeckoTokenId {
    Bitcoin = "bitcoin",
    BNB = "binancecoin",
    Ethereum = "ethereum",
    Raydium = "raydium",
    Solana = "solana",
    JitoSOL = "jito-staked-sol",
    Frax = "frax",
    USDC = "usd-coin",
    USDT = "tether",
    Orca = "orca",
    Apricot = "apricot",
    Serum = "serum",
    Samo = "samoyedcoin",
    Polis = "star-atlas-dao",
    Atlas = "star-atlas",
    WormholeEth = "ethereum-wormhole",
    UST = "terrausd",
    SoceanSol = "socean-staked-sol",
    MarinadeSol = "msol",
    LidoStakedSol = "lido-staked-sol",
    Ape = "apecoin",
    Polygon = "matic-network",
    Terra = "terra",
    Optimism = "optimism",
    Avalanche = "avalanche-2", //Note: the API requires it to be 2, kinda weird
    BUSD = "binance-usd",
    DAI = "dai",
    Fantom = "fantom",
    PYUSD = "paypal-usd",
    TUSD = "true-usd",
    XDAI = "xdai",
    Pulsechain = "pulsechain",
}

export type CoinListInfo = {
    id: string;
    symbol: string; // not upper-cased
    name: string;
    platforms: {
        ethereum?: string;
        "polygon-pos"?: string;
        "binance-smart-chain"?: string;
        solana?: string;
        avalanche?: string;
        "near-protocol"?: string;
        polkadot?: string;
        sora?: string;
        "arbitrum-one"?: string;
        fantom?: string;
        terra?: string;
        aurora?: string;
        tezos?: string;
        "optimistic-ethereum"?: string;
        base?: string;
        xdai?: string;
    };
};

export type CoinGeckoSearchCoinResult = {
    id: string;
    symbol: string;
    name: string;
    thumb: string;
    large: string;
};

export type CoinGeckoSearchResults = {
    coins: CoinGeckoSearchCoinResult[];
    exchanges: any;
    /*
    {
      id: 'agni-finance',
      name: 'Agni Finance',
      market_type: 'spot',
      thumb: 'https://assets.coingecko.com/markets/images/1199/thumb/agni.png',
      large: 'https://assets.coingecko.com/markets/images/1199/large/agni.png'
    },
    */
    categories: any;
    /*    { id: 3, name: 'Finance / Banking' }, */
};

export type CoinGeckoSearchTrendingCoinResult = {
    item: {
        id: string;
        coin_id: string;
        name: string;
        symbol: string;
        market_cap_rank: number;
        thumb: string;
        small: string;
        large: string;
        slug: string;
        price_btc: string;
        score: number;
        data: {
            price: string;
            price_btc: string;
            price_change_percentage_24h: {
                usd: number;
            };
            market_cap: string;
            market_cap_btc: string;
            total_volume: string;
            total_volume_btc: string;
            sparkline: string;
        };
        content: Maybe<{
            title: string;
            description: string;
        }>;
    };
};

export type CoinGeckoSearchTrendingResults = {
    coins: CoinGeckoSearchTrendingCoinResult[];
};

export interface CoinGeckoCoinData {
    id: string;
    symbol: string;
    name: string;
    web_slug: string;
    asset_platform_id: null;
    platforms: Record<string, string>;
    detail_platforms: Record<string, CoingeckoDetailPlatform>;
    block_time_in_minutes: number;
    hashing_algorithm: string;
    categories: string[];
    preview_listing: boolean;
    public_notice: null;
    additional_notices: string[];
    description: Record<string, string>;
    links: CoingeckoLinks;
    image: CoingeckoImage;
    country_origin: string;
    genesis_date: string;
    sentiment_votes_up_percentage: number;
    sentiment_votes_down_percentage: number;
    ico_data: CoingeckoIcoData;
    watchlist_portfolio_users: number;
    market_cap_rank: number;
    status_updates: string[];
    last_updated: string;
    trust_score: string;
    bid_ask_spread_percentage: number;
    timestamp: string;
    last_traded_at: string;
    last_fetch_at: string;
    is_anomaly: boolean;
    is_stale: boolean;
    coin_id: string;
    target_coin_id: string;
}

interface CoingeckoDetailPlatform {
    decimal_place: null;
    contract_address: string;
}

interface CoingeckoLinks {
    homepage: string[];
    whitepaper: string;
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    facebook_username: string;
    bitcointalk_thread_identifier: null;
    telegram_channel_identifier: string;
    subreddit_url: string;
    repos_url: CoingeckoReposURLs;
}

interface CoingeckoReposURLs {
    github: string[];
    bitbucket: string[];
}

interface CoingeckoImage {
    thumb: string;
    small: string;
    large: string;
}

interface CoingeckoIcoData {
    ico_start_date: string;
    ico_end_date: string;
    short_desc: string;
    description: null;
    links: Record<string, string>;
    softcap_currency: string;
    hardcap_currency: string;
    total_raised_currency: string;
    softcap_amount: null;
    hardcap_amount: null;
    total_raised: null;
    quote_pre_sale_currency: string;
    base_pre_sale_amount: null;
    quote_pre_sale_amount: null;
    quote_public_sale_currency: string;
    base_public_sale_amount: number;
    quote_public_sale_amount: number;
    accepting_currencies: string;
    country_origin: string;
    pre_sale_start_date: null;
    pre_sale_end_date: null;
    whitelist_url: string;
    whitelist_start_date: null;
    whitelist_end_date: null;
    bounty_detail_url: string;
    amount_for_sale: null;
    kyc_required: boolean;
    whitelist_available: null;
    pre_sale_available: null;
    pre_sale_ended: boolean;
}

export type CoingeckoDEXData = {
    id: string;
    type: "token";
    attributes: {
        address: string;
        name: string;
        symbol: string;
        image_url: string;
        coingecko_coin_id: string | null;
        decimals: number;
        total_supply: string;
        price_usd: string; // in dollars
        fdv_usd: string; // in dollars
        total_reserve_in_usd: string; // in dollars
        volume_usd: {
            h24: string | null; // in dollars
        };
        price_change_percentage?: {
            h1?: string;
            h24?: string;
            h6?: string;
            m5?: string;
        };
        market_cap_usd: string | null; // in dollars
    };
    relationships: {
        top_pools?: { data?: { id: string; type: "pool" }[] };
    };
};

export type CoingeckoSimpleDEXPrice = {
    id: string;
    type: "simple_token_price";
    attributes: {
        token_prices: Record<string, string>; // contract address to price ind dollars
    };
};

export type CoingeckoDEXPriceInfo = {
    provider: AccountProvider;
    contract: string;
    priceUsdDollars: string;
};

export type CoingeckoPoolDEX = {
    id: string;
    type: string;
    attributes: {
        base_token_price_usd: string;
        base_token_price_native_currency: string;
        quote_token_price_usd: string;
        quote_token_price_native_currency: string;
        base_token_price_quote_token: string;
        quote_token_price_base_token: string;
        address: string;
        name: string;
        pool_created_at: string;
        token_price_usd: string;
        fdv_usd: string;
        market_cap_usd: string;
        price_change_percentage: {
            m5: string;
            h1: string;
            h6: string;
            h24: string;
        };
        transactions: {
            m5: DEXTransactionDetails;
            m15: DEXTransactionDetails;
            m30: DEXTransactionDetails;
            h1: DEXTransactionDetails;
            h24: DEXTransactionDetails;
        };
        volume_usd: {
            m5: string;
            h1: string;
            h6: string;
            h24: string;
        };
        reserve_in_usd: string;
    };
    relationships: {
        base_token: {
            data: {
                id: string;
                type: string;
            };
        };
        quote_token: {
            data: {
                id: string;
                type: string;
            };
        };
        dex: {
            data: {
                id: string;
                type: string;
            };
        };
    };
};

export type DEXTransactionDetails = {
    buys: number;
    sells: number;
    buyers: number;
    sellers: number;
};

export type CoingeckoOHLCV = [
    timestamp: number, // unix timestamp
    open: number, // open
    high: number, // high
    low: number, // low
    close: number, // close
    volume: number // volume
];

export type CoingeckoDEXToken = {
    address: string;
    name: string;
    symbol: string;
    coingecko_coin_id: string;
};

export type CoingeckoDEXOHLCV = {
    data: {
        id: string;
        type: string;
        attributes: {
            ohlcv_list: CoingeckoOHLCV[];
        };
    };
    meta: {
        base: CoingeckoDEXToken;
        quote: CoingeckoDEXToken;
    };
};

export type CoingeckoDEXLineChartPoint = {
    timestamp: Date;
    closing: number;
    volume: number;
};

export type CoingeckoDEXCandlestickChartPoint = {
    timestamp: Date;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number | null;
};
