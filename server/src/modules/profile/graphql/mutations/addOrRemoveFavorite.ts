import { ApolloError } from "apollo-server-errors";
import { mutationField, nonNull, nullable, stringArg } from "nexus";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { WatchlistAssetService } from "src/modules/watchlist/services/watchlistAssetService";
import { pgFavoriteMemecoinRepo } from "../../infra";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";

export const addOrRemoveFavorite = mutationField("addOrRemoveFavorite", {
    type: nonNull("FavoriteMemecoin"),
    args: {
        provider: nonNull("AccountProviderEnum"),
        contractAddress: nonNull(stringArg()),
        iconImageUrl: nullable(stringArg()),
        name: nonNull(stringArg()),
        symbol: nonNull(stringArg()),
    },
    resolve: async (_parent, args, ctx, _info) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;
        const {
            provider: _provider,
            contractAddress,
            name,
            symbol,
            iconImageUrl,
        } = args;

        const provider = ACCOUNT_PROVIDER_GQL_TO_DOMAIN[_provider];

        // get watchlist assets for user
        const favoriteCoinsResponse =
            await pgFavoriteMemecoinRepo.findForContractAddressAndProvider(
                user.id,
                contractAddress,
                provider
            );

        throwIfError(favoriteCoinsResponse);

        const favCoin = favoriteCoinsResponse.value;

        if (favCoin) {
            console.log(`[deleting favorite]`);

            // delete it
            const deleteResp = await pgFavoriteMemecoinRepo.delete(favCoin.id);

            throwIfError(deleteResp);

            return favCoin;
        }

        console.log(`[adding favorite]`);

        // otherwise create it
        const createResp = await pgFavoriteMemecoinRepo.create({
            userId: user.id,
            provider,
            contractAddress,
            iconImageUrl: iconImageUrl || null,
            name,
            symbol,
        });

        throwIfError(createResp);

        return createResp.value;
    },
});
