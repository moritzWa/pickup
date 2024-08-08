import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { InteractionType } from "src/core/infra/postgres/entities/Interaction";
import { NexusGenEnums } from "src/core/surfaces/graphql/generated/nexus";

export const Queue = objectType({
    name: "Queue",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.id("contentId");
        t.nonNull.id("userId");
        t.nonNull.float("position");
        t.field("content", {
            type: nullable("Content"),
        });
        t.field("contentSession", {
            type: nullable("ContentSession"),
        });
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
