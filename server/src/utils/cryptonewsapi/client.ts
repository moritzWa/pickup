import axios from "axios";
import { config } from "src/config";
import { wrapAxiosWithRetry } from "src/utils";

const TIMEOUT = 20 * 1000;

const client = axios.create({
    timeout: TIMEOUT,
    baseURL: "https://cryptonews-api.com/api/v1",
    // headers: {
    //     "X-API-KEY": config.cryptonewsapi.apiKey,
    // },
    // params: {
    //     token: config.cryptonewsapi.apiKey,
    // },
});

wrapAxiosWithRetry(client, {
    // this way if we have to retry, the timeout resets to the above 15 seconds
    // we want this behavior
    shouldResetTimeout: true,
});

export { client };
