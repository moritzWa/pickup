import { config } from "src/config";
import { AccountProvider } from "src/core/infra/postgres/entities";

const getOnrampUrl = (
    amountUsd: number,
    chain: AccountProvider,
    address: string,
    theme: string
) => {
    const wallet = `${chain.toLowerCase()}:${address}`;

    const params = new URLSearchParams({
        defaultFiat: "USD",
        defaultAmount: amountUsd.toString(),
        networkWallets: wallet,
        onlyCryptoNetworks: "solana",
        defaultCrypto: "usdc_solana",
        apiKey: config.onramper.apiKey,
        themeName: theme,
    });

    const url = `https://buy.onramper.com?` + params.toString();

    return url;
};

export const OnramperService = {
    getOnrampUrl,
};
