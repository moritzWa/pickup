import { readFileSync } from "fs";

// Note: have to do this for now bc there is weird esmodule interop issue here
const fuseClient = require("fuse.js");

import * as path from "path";
import {
    DefaultErrors,
    failure,
    FailureOrSuccess,
    Maybe,
    success,
    UnexpectedError,
} from "src/core/logic";

export type CoinGeckoData = {
    id: string;
    symbol: string;
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
    };
};

// Note: this is pretty large file, prob 2.3MB so loading server cold start
// is going to require it to be loaded into memory
const coinData = JSON.parse(
    readFileSync(
        path.join(__dirname, "../../../data/coingecko.json")
    ).toString()
) as CoinGeckoData[];

const options = {
    includeScore: true,
    keys: ["name", "symbol"],
};

// ======= DEPRECATED =========== removing in favor on the constant sync
export const _buildContractMapping = (): Record<string, string> => {
    return coinData.reduce<any>((acc, c) => {
        const symbol = c.symbol.toLowerCase();
        const isSame = c.symbol.toLowerCase() === c.id.toLowerCase();
        const exists = acc[symbol];
        // lots of pegs we don't give a shit about
        const isPeg = c.id.includes("peg");

        const shouldInclude = isSame || (!exists && !isPeg);

        return {
            ...acc,
            // if the symbol = coingecko or it doesn't exist yet set it. this isn't a silver bullet
            ...(shouldInclude ? { [c.symbol.toLowerCase()]: c.id } : {}),
            ...Object.entries(c.platforms).reduce(
                (acc, [_key, value]) => ({
                    ...acc,
                    ...(value ? { [value.toLowerCase()]: c.id } : {}),
                }),
                {}
            ),
        };
    }, {});
};

const fuse = new fuseClient(coinData, options);

const search = (
    name: string,
    limit: number = 10
): FailureOrSuccess<DefaultErrors, any[]> => {
    try {
        const result = fuse.search(name);

        return success(result.slice(0, limit)); // only return 10 best results
    } catch (err) {
        return failure(new UnexpectedError(err));
    }
};

// this is a stub that just means this file is called (which reads the json in)
const load = () => {};

export const CoingeckoSearch = {
    search,
    load,
    buildMapping: _buildContractMapping,
};
