import { mutationField, nonNull, nullable, stringArg } from "nexus";
import { Context, throwIfNotAdmin } from "src/core/surfaces/graphql/context";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { BlacklistService } from "../../services";
import { AccountProvider } from "src/core/infra/postgres/entities";

export const createBlacklistToken = mutationField("createBlacklistToken", {
    type: nonNull("String"),
    args: {
        provider: nonNull("AccountProviderEnum"),
        symbol: nonNull(stringArg()),
        name: nonNull(stringArg()),
        coingeckoId: nullable(stringArg()),
        contractAddress: nonNull(stringArg()),
        iconImageUrl: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const {
            provider,
            symbol,
            name,
            coingeckoId,
            contractAddress,
            iconImageUrl,
        } = args;

        // permissions check
        throwIfNotAdmin(ctx);

        // create blacklist token
        const createResp = await BlacklistService.create({
            provider: provider as AccountProvider,
            symbol,
            name,
            contractAddress,
            iconImageUrl,
        });
        throwIfError(createResp);

        return "OK";
    },
});
