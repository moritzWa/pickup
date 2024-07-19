import axios from "axios";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    success,
    UnexpectedError,
} from "src/core/logic";

const client = axios.create({
    baseURL: "https://public-api.solscan.io",
});

export type SolscanTokenMetadata = {
    symbol: string;
    name: string;
    icon: string;
    website: string;
    twitter: string;
    tag: any;
    decimals: number;
    coingeckoId: string;
    holder: number;
};

const getTokenMetadata = async (
    tokenAddress: string
): Promise<FailureOrSuccess<DefaultErrors, SolscanTokenMetadata>> => {
    try {
        const response = await client.get<SolscanTokenMetadata>(`/token/meta`, {
            params: {
                tokenAddress,
            },
        });

        return success(response.data);
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

export const solscan = {
    tokens: { metadata: getTokenMetadata },
};
