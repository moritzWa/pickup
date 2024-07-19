import { AccountProvider } from "src/core/infra/postgres/entities";
import { CoinGeckoTokenId } from "src/utils/coingecko/types";

export const STABLE_COIN_COIN_GECKOS = new Set<string>([
    CoinGeckoTokenId.USDC,
    CoinGeckoTokenId.USDT,
    CoinGeckoTokenId.BUSD,
    CoinGeckoTokenId.DAI,
    CoinGeckoTokenId.PYUSD,
    CoinGeckoTokenId.TUSD,
    CoinGeckoTokenId.Frax,
]);

export const STABLE_COIN_IDENTIFIERS = new Set<string>([
    // USDC
    `${AccountProvider.Solana}:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
    // USDT
    `${AccountProvider.Solana}:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`,
]);
