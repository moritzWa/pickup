import { intArg, list, nonNull, queryField, stringArg } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Context } from "src/core/surfaces/graphql/context";
import { curiusLinkRepo } from "../../infra";
import { DEFAULT_LINKS_RETURN } from "../../infra/linkRepo";
import { SearchResult } from "../types/SearchResult";

export const searchSimilarLinks = queryField("searchSimilarLinks", {
    type: nonNull(list(nonNull(SearchResult))),
    args: {
        query: nonNull(stringArg()),
        limit: intArg({ default: DEFAULT_LINKS_RETURN }),
    },
    resolve: async (_parent, args, ctx: Context) => {
        // TODO: add back authentication
        // throwIfNotAuthenticated(ctx);

        const { query, limit } = args;

        const similarLinksResponse = await curiusLinkRepo.findSimilarLinks(
            query,
            limit ?? DEFAULT_LINKS_RETURN
        );

        throwIfError(similarLinksResponse);

        return similarLinksResponse.value.map((link) => ({
            ...link,
            averageDistance: link.averageDistance,
            minDistance: link.minDistance,
        }));
    },
});
