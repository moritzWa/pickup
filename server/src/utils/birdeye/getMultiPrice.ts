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

type BirdeyePriceData = {
    priceChange24h: Maybe<number>; // can be null sometimes
    updateHumanTime: string;
    updateUnixTime: number;
    value: number;
};

// max: 100 tokens
export const getMultiPrice = async (
    addresses: string[]
): Promise<FailureOrSuccess<DefaultErrors, Dictionary<BirdeyePriceData>>> => {
    try {
        if (!addresses.length) {
            return success({});
        }

        const response = await client.get("/defi/multi_price", {
            params: {
                list_address: addresses.join(","),
            },
        });

        if (response.status !== 200) {
            return failure(new Error("Failed to fetch token list"));
        }

        Datadog.increment("birdeye.get_multi_price.ok", 1);

        return success(response.data.data);
    } catch (error) {
        const tags = {};
        if (error instanceof AxiosError) {
            tags["status"] = error.response?.status || "none";
        }

        Datadog.increment("birdeye.get_multi_price.err", 1, tags);

        return failure(new UnexpectedError(error));
    }
};
