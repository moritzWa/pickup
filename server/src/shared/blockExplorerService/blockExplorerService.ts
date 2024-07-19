import { AccountProvider } from "src/core/infra/postgres/entities";
import { Maybe } from "src/core/logic";

const getBlockExplorerInfo = (
    chain: AccountProvider,
    hash: string
): Maybe<{ url: string; name: string }> => {
    if (chain === AccountProvider.Solana) {
        return {
            url: `https://solscan.io/tx/${hash}`,
            name: "Solscan",
        };
    }

    return null;
};

export const BlockExplorerService = {
    getBlockExplorerInfo,
};
