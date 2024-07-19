import { objectType, nonNull, list, enumType } from "nexus";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export const DiscoveryUserResult = objectType({
    name: "DiscoveryUserResult",
    definition(t) {
        t.nonNull.string("username");
        t.nonNull.string("name");
    },
});
