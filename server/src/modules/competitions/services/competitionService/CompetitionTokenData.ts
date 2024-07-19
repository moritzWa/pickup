import { Maybe } from "graphql/jsutils/Maybe";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export type CompetitionTokenData = {
    id: string;
    coinGeckoTokenId?: string | null;
    contractAddress: string;
    iconImageUrl: string;
    name: string;
    priceChangePercentage24h?: number | null;
    priceChangePercentage24hFormatted?: string | null;
    priceFormatted?: string | null;
    provider: NexusGenEnums["AccountProviderEnum"];
    symbol: string;
    marketCap?: Maybe<string>;
    vol24h?: Maybe<string>;
};
