import { intArg, list, nonNull, queryField, stringArg } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { Context } from "src/core/surfaces/graphql/context";
import { curiusLinkRepo } from "../../infra";
import { SearchResult } from "../types/SearchResult";

export const searchSimilarLinks = queryField("searchSimilarLinks", {
    type: nonNull(list(nonNull(SearchResult))),
    args: {
        query: nonNull(stringArg()),
        limit: intArg({ default: 3 }),
    },
    resolve: async (_parent, args, ctx: Context) => {
        // throwIfNotAuthenticated(ctx);

        const { query, limit } = args;
        const defaultLimit = 4;

        const similarLinksResponse = await curiusLinkRepo.findSimilarLinks(
            query,
            limit ?? defaultLimit
        );

        throwIfError(similarLinksResponse);

        return similarLinksResponse.value.map((link) => ({
            ...link,
            averageDistance: link.averageDistance,
            chunkMatchesForLink: link.chunkMatchesForLink,
        }));
    },
});
