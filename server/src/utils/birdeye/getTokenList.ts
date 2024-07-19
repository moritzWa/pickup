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

type BirdeyeToken = {
    address: string;
    decimals: number;
    lastTradeUnixTime: number;
    liquidity: number;
    logoURI: string;
    mc: number;
    name: string;
    symbol: string;
    v24hChangePercent: Maybe<number>;
    v24hUSD: number;
};

type BirdeyeTokenList = {
    tokens: BirdeyeToken[];
    total: number;
    updateTime: string;
    updateUnixTime: number;
};

export const getTokenList = async (): Promise<
    FailureOrSuccess<DefaultErrors, BirdeyeTokenList>
> => {
    try {
        // const options = {
        //     method: "GET",
        //     headers: { "X-API-KEY": "dbc8dd62ba2d4cb98d7584067839016b" },
        // };

        // fetch(
        //     "https://public-api.birdeye.so/public/tokenlist?sort_by=v24hUSD&sort_type=desc",
        //     options
        // )
        //     .then((response) => response.json())
        //     .then((response) => console.log(response))
        //     .catch((err) => console.error(err));

        const response = await client.get("/defi/tokenlist", {
            params: {
                sort_by: "v24hUSD",
                sort_type: "desc",
            },
        });

        if (response.status !== 200) {
            return failure(new Error("Failed to fetch token list"));
        }

        Datadog.increment("birdeye.get_token_list.ok", 1);

        return success(response.data.data);
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";
        }

        Datadog.increment("birdeye.get_token_list.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};
