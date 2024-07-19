import { ApolloError } from "apollo-server-errors";
import { idArg, list, nonNull, queryField, stringArg } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { UserService } from "src/modules/users/services";
import { ProfileService } from "../../services";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { pgFavoriteMemecoinRepo } from "../../infra";

export const getFavoriteMemecoinsForUser = queryField(
    "getFavoriteMemecoinsForUser",
    {
        type: nonNull(list(nonNull("FavoriteMemecoin"))),
        args: {
            userId: nonNull(idArg()),
        },
        resolve: async (_parent, args, ctx, _info) => {
            const { userId } = args;
            const user = ctx.me; // NOTE: does not always exist, not calling throwIfNotAuthenticated

            const coinsResponse = await pgFavoriteMemecoinRepo.findForUser(
                userId
            );

            throwIfError(coinsResponse);

            return coinsResponse.value;
        },
    }
);
