import { objectType, nonNull, list, enumType } from "nexus";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export const BasicCompetitionDetails = objectType({
    name: "BasicCompetitionDetails",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("name");
        t.nonNull.id("token1Id");
        t.nonNull.id("token2Id");
        t.nonNull.date("createdAt");
    },
});
