import { objectType, nonNull, list, enumType } from "nexus";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export const FullCompetitionDetails = objectType({
    name: "FullCompetitionDetails",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("name");
        t.nonNull.field("token1", {
            type: "TokenData",
        });
        t.nonNull.field("token2", {
            type: "TokenData",
        });
        t.nonNull.date("createdAt");
    },
});
