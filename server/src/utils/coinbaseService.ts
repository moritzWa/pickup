import * as coinbase from "coinbase";
import axios from "axios";
import { Failure, failure, FailureOrSuccess, success } from "src/core/logic";
import * as fs from "fs";
import { flatten } from "lodash";
import { config } from "src/config";
import { DefaultErrors, UnexpectedError } from "src/core/logic/errors";

const COINBASE_CLIENT_ID = config.coinbase.clientId;
const COINBASE_CLIENT_SECRET = config.coinbase.secretKey;

const restClient = axios.create({
    baseURL: "https://api.coinbase.com",
    headers: {
        "CB-VERSION": "2021-12-20",
    },
});

export type CoinbaseTokenResponse = {
    access_token: string;
    token_type: "bearer";
    expires_in: number; // in seconds
    refresh_token: string;
};

export type RefreshResponse = {
    accessToken: string;
    refreshToken: string;
};

const _refreshToken = async (
    refreshToken: string
): Promise<FailureOrSuccess<Error, RefreshResponse>> => {
    try {
        const { data } = await restClient.post<CoinbaseTokenResponse>(
            "/oauth/token",
            {
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }
        );

        return success({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        });
    } catch (err) {
        const error: any = err;

        return failure(new Error(error.message));
    }
};

const _getUser = async (accessToken: string): Promise<coinbase.User> => {
    const { data } = await restClient.get("/v2/user", {
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    });

    return data.data;
};

const _getAccountsForUser = async (
    accessToken: string
): Promise<coinbase.Account[]> => {
    const { data } = await restClient.get("/v2/accounts", {
        params: {
            limit: 250,
        },
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    });

    return data.data;
};

const _getTransactions = async (
    accessToken: string,
    account: coinbase.Account
): Promise<FailureOrSuccess<DefaultErrors, coinbase.Transaction[]>> => {
    try {
        const { data } = await restClient.get(
            `/v2/accounts/${account.id}/transactions`,
            {
                params: {
                    limit: 100,
                },
                headers: {
                    Authorization: "Bearer " + accessToken,
                },
            }
        );

        return success(data.data);
    } catch (err) {
        console.error("failed for ", account.name);
        return failure(new UnexpectedError(err));
    }
};

const getTransactions = async (accessToken: string) => {
    const accounts = await _getAccountsForUser(accessToken);

    const transactions = await Promise.all(
        accounts.map((a) => _getTransactions(accessToken, a))
    );

    console.log("DONE!");

    return [];
};

const getAccessToken = async (
    code: string,
    redirectUri: string
): Promise<FailureOrSuccess<DefaultErrors, CoinbaseTokenResponse>> => {
    try {
        const response = await restClient.post("/oauth/token", {
            grant_type: "authorization_code",
            code,
            client_id: COINBASE_CLIENT_ID,
            client_secret: COINBASE_CLIENT_SECRET,
            redirect_uri: redirectUri,
        });

        console.log(response.data);
        return success(response.data);
    } catch (err) {
        console.error(err);
        return failure(new UnexpectedError(err));
    }
};

export const Coinbase = {
    tokens: { refresh: _refreshToken, access: getAccessToken },
    transactions: { list: getTransactions },
    users: { me: _getUser },
};
