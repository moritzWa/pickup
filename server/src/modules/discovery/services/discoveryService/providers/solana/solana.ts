import { getJupiterTokens, fetchJupiterTokensWithoutCache } from "./jupiter";

export const SolanaDiscoveryProvider = {
    birdeye: {},
    jupiter: {
        fetchJupiterTokensWithoutCache,
        getJupiterTokens,
    },
};
