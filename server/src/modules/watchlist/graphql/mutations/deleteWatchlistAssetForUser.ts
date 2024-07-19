import { mutationField, nonNull, stringArg } from "nexus";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { WatchlistAssetService } from "src/modules/watchlist/services/watchlistAssetService";

export const deleteWatchlistAssetForUser = mutationField(
    "deleteWatchlistAssetForUser",
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

            if (userId !== user.id) {
                throw new Error("Unauthorized");
            }

            // create watchlist asset
            const deleteWatchlistAssetForUserResp =
                await WatchlistAssetService.deleteForUser(
                    userId,
                    provider as AccountProvider,
                    contractAddress
                );
            throwIfError(deleteWatchlistAssetForUserResp);

            return "";
        },
    }
);
