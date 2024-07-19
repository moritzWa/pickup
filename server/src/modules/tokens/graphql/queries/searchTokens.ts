import { list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";
import { TradingIntegrationService } from "src/shared/integrations";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { ACCOUNT_PROVIDER_GQL_TO_DOMAIN } from "src/modules/identical";
import { TradingSide } from "src/core/infra/postgres/entities";

export const SearchTokensResponse = objectType({
    name: "SearchTokensResponse",
    definition(t) {
        t.field("tokens", {
            type: nonNull(list(nonNull("TokenSearchResult"))),
        });
        t.field("recommended", { type: nullable("TokenSearchResult") });
    },
});

// Note: don't need to be logged in to get a quote. should prob rate limit
export const searchTokens = queryField("searchTokens", {
    type: nonNull("SearchTokensResponse"),
    args: {
        provider: nonNull("AccountProviderEnum"),
        search: nullable("String"),
        side: nullable("TradingSideEnum"),
    },
    resolve: async (_parent, args, ctx: Context) => {
        const me = ctx.me;
        const { provider, search, side: _side } = args;

        const tradingServiceResponse = TradingIntegrationService.getIntegration(
            ACCOUNT_PROVIDER_GQL_TO_DOMAIN[provider]
        );

        throwIfError(tradingServiceResponse);

        const tradingService = tradingServiceResponse.value;

        const random = Math.random();
        // console.time("search-tokens-" + random);

        const tokenInfoResponse = await tradingService.searchTokens({
            search: search ?? null,
            user: me,
            side: _side === "buy" ? TradingSide.Buy : TradingSide.Sell,
        });

        // console.timeEnd("search-tokens-" + random);

        throwIfError(tokenInfoResponse);

        const { results: searchResults, recommended } = tokenInfoResponse.value;

        return {
            tokens: searchResults,
            recommended,
        };
    },
});
