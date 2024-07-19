import { enumType, list, mutationField, nonNull, queryField } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { MagicPortfolioService } from "../../services/portfolioService/magicPortfolioService";

export const refreshPortfolio = mutationField("refreshPortfolio", {
    type: nonNull("String"),
    resolve: async (_parent, args, ctx) => {
        throwIfNotAuthenticated(ctx);

        const user = ctx.me!;

        // console.log(`[refreshing portfolio for ${user.id}]`);

        const positionsResponse =
            await MagicPortfolioService.getFullPositionsFromMagicAndSetCache(
                user
            );

        throwIfError(positionsResponse);

        return "Refreshed portfolio 🔄";
    },
});
