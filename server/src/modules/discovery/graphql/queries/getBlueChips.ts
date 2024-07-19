import { list, nonNull, nullable, objectType, queryField } from "nexus";
import { throwIfError } from "src/core/surfaces/graphql/common";
import { throwIfNotAuthenticated } from "src/core/surfaces/graphql/context";
import { DiscoveryService } from "../../services/discoveryService/discoveryService";
import { NexusGenObjects } from "src/core/surfaces/graphql/generated/nexus";
import { birdeye } from "src/utils/birdeye";
import { AccountProviderEnum } from "src/shared/schemas";
import { AccountProvider } from "src/core/infra/postgres/entities";
import { formatPrice } from "../../services/discoveryService/providers/solana/utils";

export const BlueChipData = objectType({
    name: "BlueChipData",
    definition(t) {
        t.nonNull.string("contractAddress");
        t.nonNull.string("symbol");
        t.nonNull.string("name");
        t.nonNull.string("iconImageUrl");
        t.field("provider", { type: nonNull("AccountProviderEnum") });
        t.nullable.string("priceFormatted");
        t.nullable.float("priceChangePercentage24h");
        t.nullable.string("priceChangePercentage24hFormatted");
        t.nullable.boolean("isClaimed");
        t.nullable.boolean("isMovementVerified");
        t.nullable.boolean("isStrict");
    },
});

export const GetBlueChipsResponse = objectType({
    name: "GetBlueChipsResponse",
    definition(t) {
        t.field("results", {
            type: nonNull(list(nonNull("BlueChipData"))),
        });
    },
});

export const getBlueChips = queryField("getBlueChips", {
    type: nonNull("GetBlueChipsResponse"),
    resolve: async (_parent, args, ctx) => {
        // throwIfNotAuthenticated(ctx);
        // const user = ctx.me!;

        const blueChipsResp = await DiscoveryService.getBlueChips();
        throwIfError(blueChipsResp);
        const blueChips = blueChipsResp.value;

        return {
            results: blueChips,
        };
    },
});
