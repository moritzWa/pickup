import { ApolloError } from "apollo-server-errors";
import { mutationField, nonNull, stringArg } from "nexus";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { WatchlistAssetService } from "src/modules/watchlist/services/watchlistAssetService";

export const createWatchlistAssetForUser = mutationField(
    "createWatchlistAssetForUser",
    {
        type: nonNull("String"),
        args: {
            userId: nonNull(stringArg()),
            provider: nonNull("AccountProviderEnum"),
            contractAddress: nonNull(stringArg()),
        },
        resolve: async (_parent, args, ctx, _info) => {
            throwIfNotAuthenticated(ctx);
            const user = ctx.me!;
            const { userId, provider, contractAddress } = args;

            // if user id is not the same as the authenticated user id, throw an error
            if (userId !== user.id) {
                throw new Error("Unauthorized");
            }

            // get watchlist assets for user
            const watchlistAssetsResp = await WatchlistAssetService.findForUser(
                user.id
            );
            throwIfError(watchlistAssetsResp);
            const watchlistAssets = watchlistAssetsResp.value;

            // throw errors: duplicates, 50+ (i think it causes bugs with birdeye if we request too many)
            if (
                watchlistAssets.some(
                    (wa) => wa.contractAddress === contractAddress
                )
            ) {
                throw new ApolloError(
                    "This asset is already in your watchlist"
                );
            }
            if (watchlistAssets.length >= 50) {
                throw new ApolloError(
                    "You can only have 50 assets in your watchlist"
                );
            }

            // create watchlist asset
            const createWatchlistAssetResp =
                await WatchlistAssetService.createForUser(
                    userId,
                    provider as AccountProvider,
                    contractAddress
                );
            throwIfError(createWatchlistAssetResp);

            return "";
        },
    }
);
