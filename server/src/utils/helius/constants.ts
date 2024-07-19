import axios from "axios";
import { config } from "src/config";
import { wrapAxiosWithRetry } from "../helpers";
import { Connection } from "@solana/web3.js";

const API_KEY = config.helius.apiKey;

const baseUrl = "https://api.helius.xyz";
const rpcUrl = "https://rpc.helius.xyz";
const heliusRpcUrl = "https://mainnet.helius-rpc.com";
// export const heliusDedicatedNodeRprcUrl =
//     "http://gladdest-nincompooperies-EV3s9PJgKp.helius-rpc.com";

export const TOKEN_ACCOUNT_PROGRAM_ID =
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const STAKE_ACCOUNT_PROGRAM_ID =
    "Stake11111111111111111111111111111111111111";

const apiClient = axios.create({
    baseURL: baseUrl,
    timeout: 30 * 1000, // only allow 30 seconds to make te request
    params: {
        "api-key": API_KEY,
    },
});

// solana
const rpcClient = axios.create({
    baseURL: rpcUrl,
    params: {
        "api-key": API_KEY,
    },
});

// for helius rpc
const heliusRpcClient = axios.create({
    baseURL: heliusRpcUrl,
    params: {
        "api-key": API_KEY,
    },
});

wrapAxiosWithRetry(apiClient, {
    // this way if we have to retry, the timeout resets to the above 15 seconds
    // we want this behavior
    shouldResetTimeout: true,
    retries: 3,
});

wrapAxiosWithRetry(rpcClient, {
    // this way if we have to retry, the timeout resets to the above 15 seconds
    // we want this behavior
    shouldResetTimeout: true,
    retries: 3,
});

export const connection = new Connection(
    `${rpcUrl}?api-key=${config.helius.apiKey}`
);

export const _alchemyConnection = new Connection(
    `https://solana-mainnet.g.alchemy.com/v2/${config.alchemy.solanaApiKey}`
);

const ATLAS_SERVER = config.atlasServiceUrl;
const IRON_FORGE_URL = `https://rpc.ironforge.network/mainnet?apiKey=01HT9T9TE43WCAGVMJHWV04RJK`;

export const depr_atlasConnection = ATLAS_SERVER
    ? new Connection(ATLAS_SERVER)
    : null;

export const ironForgeConnection = new Connection(IRON_FORGE_URL);

export const jitoConnection = new Connection(
    "https://mainnet.block-engine.jito.wtf/api/v1/transactions"
);

// export const tritonConnection = new Connection(
//     "https://jmine-main465-387a.mainnet.rpcpool.com/9e9efec3-d49a-4b4f-af70-dd81b73ffd0f"
// );

// export const depr_heliusDedicatedRpc = heliusDedicatedNodeRprcUrl
//     ? new Connection(heliusDedicatedNodeRprcUrl)
//     : null;

export { apiClient, rpcClient, heliusRpcClient };
