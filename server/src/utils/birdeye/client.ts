import axios from "axios";
import { config } from "src/config";
import { wrapAxiosWithRetry } from "src/utils";

const TIMEOUT = 5 * 1000;

const client = axios.create({
    timeout: TIMEOUT,
    baseURL: "https://public-api.birdeye.so",
    headers: {
        "X-API-KEY": config.birdeye.apiKey,
        // "x-chain": "solana",
    },
});

wrapAxiosWithRetry(client, {
    retries: 0,
    // this way if we have to retry, the timeout resets to the above 15 seconds
    // we want this behavior
    shouldResetTimeout: true,
});

export { client };
