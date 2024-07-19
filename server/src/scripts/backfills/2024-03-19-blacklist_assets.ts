// npx ts-node --transpile-only -r tsconfig-paths/register src/scripts/backfills/2024-03-19-blacklist_assets.ts

import { connect } from "src/core/infra/postgres";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { DiscoverySplashCacheService } from "src/modules/discovery/services";
// import { BlacklistService } from "src/modules/discovery/services/deprecated_blacklistCacheService";

const investing_assets = [
    {
        contractAddress: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        provider: AccountProvider.Solana,
        name: "Jupiter",
        symbol: "JUP",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
        provider: AccountProvider.Solana,
        name: "Jito Staked SOL",
        symbol: "JitoSOL",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
        provider: AccountProvider.Solana,
        name: "BlazeStake Staked SOL (bSOL)",
        symbol: "bSOL",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
        provider: AccountProvider.Solana,
        name: "Marinade staked SOL (mSOL)",
        symbol: "mSOL",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
        provider: AccountProvider.Solana,
        name: "Jupiter Perps LP",
        symbol: "JLP",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        provider: AccountProvider.Solana,
        name: "Raydium",
        symbol: "RAY",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
        provider: AccountProvider.Solana,
        name: "Wrapped BTC (Wormhole)",
        symbol: "WBTC",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
        provider: AccountProvider.Solana,
        name: "Wrapped Ether (Wormhole)",
        symbol: "WETH",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
        provider: AccountProvider.Solana,
        name: "JITO",
        symbol: "JTO",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
        provider: AccountProvider.Solana,
        name: "Pyth Network",
        symbol: "PYTH",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
        provider: AccountProvider.Solana,
        name: "Render Token",
        symbol: "RENDER",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
        provider: AccountProvider.Solana,
        name: "Lido Staked SOL",
        symbol: "stSOL",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
        provider: AccountProvider.Solana,
        name: "Orca",
        symbol: "ORCA",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux",
        provider: AccountProvider.Solana,
        name: "Helium Network Token",
        symbol: "HNT",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6",
        provider: AccountProvider.Solana,
        name: "Helium Mobile",
        symbol: "MOBILE",
        coingeckoTokenId: null,
    },
    {
        contractAddress: "LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp",
        provider: AccountProvider.Solana,
        name: "Liquid Staking Token",
        symbol: "LST",
        coingeckoTokenId: null,
    },
];

export const run = async () => {
    // const INVESTING = [
    //     "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    //     "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    //     "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
    //     "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    //     "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
    //     "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    //     "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
    //     "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    //     "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
    //     "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    //     "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",
    //     "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",
    //     "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    //     "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux",
    //     "mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6",
    //     "LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp",
    // ];
    // // discoverySplashResp.value.data.results.filter(d => INVESTING.includes(d.contractAddress))
    // // // fetch discovery splash cache
    // // const discoverySplashResp = await DiscoverySplashCacheService.fetch();
    // // throwIfError(discoverySplashResp);
    // // const d = discoverySplashResp.value || { data: { results: [] } };
    // // console.log("Discovery Splash: ", JSON.stringify(d, null, 2));
    // // add assets to blacklist
    // for (const inv of investing_assets) {
    //     const addResp = await BlacklistService.addAsset(inv);
    // }
    // // find all assets that are investment, not trading
    // console.log("x");
    // // // add asset
    // // console.log("add 1...........");
    // // const addResp = await BlacklistService.addAsset({
    // //     contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    // //     provider: AccountProvider.Solana,
    // //     name: "Tether USDT",
    // //     symbol: "USDT",
    // //     coingeckoTokenId: "tether",
    // // });
    // // console.log("add 1 end...........");
    // // // fetch blacklist 2
    // // console.log("fetch 2...........");
    // // const getResp2 = await BlacklistService.fetch();
    // // throwIfError(getResp2);
    // // const g2 = getResp2.value || { blacklistedAssets: [] };
    // // console.log("Blacklist: ", JSON.stringify(g2, null, 2));
    // // console.log("fetch 2 end...........");
    // // // remove asset
    // // const removeResp = await BlacklistService.removeAsset({
    // //     contractAddress: "0x123",
    // //     provider: AccountProvider.Solana,
    // //     name: "Tether USD",
    // //     symbol: "USDT",
    // //     coingeckoTokenId: "usdt",
    // // });
    // // // fetch blacklist 3
    // // const getResp3 = await BlacklistService.fetch();
    // // throwIfError(getResp);
    // // const g3 = getResp.value || { blacklistedAssets: [] };
    // // console.log("Blacklist: ", JSON.stringify(g3, null, 2));
};

connect()
    .then(() => run())
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("===== ERROR RUNNING BACKFILL =====");
        console.error(err);
        process.exit(1);
    });
