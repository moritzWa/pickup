import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { DiscoveryService } from "../../services/discoveryService/discoveryService";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { birdeye } from "src/utils/birdeye";
import { AccountProviderEnum } from "src/shared/schemas";
import { AccountProvider } from "src/core/infra/postgres/entities";

export const GetDiscoverySplashResponse = objectType({
    name: "GetDiscoverySplashResponse",
    definition(t) {
        t.field("results", {
            type: nonNull(list(nonNull("DiscoverySplashResult"))),
        });
        t.field("blueChips", {
            type: nonNull(list(nonNull("DiscoverySplashResult"))),
        });
        t.field("categories", {
            type: nonNull(list(nonNull("DiscoveryCategory"))),
        });
        t.field("competitions", {
            type: nonNull(list(nonNull("FullCompetitionDetails"))),
        });
    },
});

export const getDiscoverySplash = queryField("getDiscoverySplash", {
    type: nonNull("GetDiscoverySplashResponse"),
    resolve: async (_parent, args, ctx) => {
        // throwIfNotAuthenticated(ctx);
        // const user = ctx.me!;

        const resp = await DiscoveryService.getDiscoverySplash();
        throwIfError(resp);
        return resp.value;
    },
});
