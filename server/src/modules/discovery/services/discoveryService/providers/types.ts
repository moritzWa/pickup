import { AccountProvider } from "src/core/infra/postgres/entities";

export type DiscoveryResult = {
    coinGeckoTokenId: string | null;
    name: string;
    symbol: string;
    iconImageUrl: string;
    contractAddress: string;
    provider: AccountProvider;
    price: number | null;
    priceFormatted: string | null;
};
