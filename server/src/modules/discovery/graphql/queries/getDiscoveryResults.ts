import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { ApolloError } from "apollo-server-errors";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { searchTokens } from "src/shared/integrations/providers/solana/searchTokens";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { DiscoveryService } from "../../services/discoveryService/discoveryService";
import { logHistogram } from "src/utils";

export const GetDiscoveryResultsResponse = objectType({
    name: "GetDiscoveryResultsResponse",
    definition(t) {
        t.field("categories", {
            type: nonNull(list(nonNull("CategoryMetadata"))),
        });
        t.field("results", {
            // v1 - tokens only
            type: nonNull(list(nonNull("DiscoveryResult"))),
        });
        t.field("users", {
            type: nonNull(list(nonNull("DiscoveryUserResult"))),
        });
    },
});

export const getDiscoveryResults = queryField("getDiscoveryResults", {
    type: nonNull("GetDiscoveryResultsResponse"),
    args: {
        query: nonNull("String"),
    },
    resolve: async (_parent, args, ctx) => {
        const start = Date.now();
        // throwIfNotAuthenticated(ctx);
        // const user = ctx.me!;
        const { query } = args;

        if (!query) {
            return {
                categories: [],
                results: [],
                users: [],
            };
        }

        const resp = await DiscoveryService.getDiscoverySearchResults(query);
        throwIfError(resp);
        const value = resp.value;

        const end = Date.now();
        logHistogram({
            metric: "get_discovery_results_endpoint.duration",
            value: end - start,
            tags: { query },
        });

        return value;
    },
});
