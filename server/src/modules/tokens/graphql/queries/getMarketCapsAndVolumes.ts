import { list, nonNull, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { coingecko } from "src/utils";
import { uniq } from "lodash";
import { ApolloError } from "apollo-server-errors";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { MarketCapVolumeService } from "../../services/marketCapVolumeService";

export const getMarketCapsAndVolumes = queryField("getMarketCapsAndVolumes", {
    type: nonNull(list(nonNull("GetMarketCapsAndVolumesResponse"))),
    args: {
        tokens: nonNull(list(nonNull("TokenAddressAndProvider"))),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const { tokens } = args;

        const providers = uniq(tokens.map((t) => t.provider));

        if (providers.length === 0) return [];

        if (providers.length !== 1)
            throw new ApolloError("All tokens must have the same provider");

        if (tokens.length === 0) return [];

        const response = await MarketCapVolumeService.getMarketCapAndVolume(
            tokens.map((t) => ({
                provider: t.provider as AccountProvider,
                contractAddress: t.contractAddress,
            }))
        );

        throwIfError(response);

        const data = response.value;

        return data;
    },
});
