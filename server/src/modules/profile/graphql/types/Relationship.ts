import { enumType, list, nonNull, nullable, objectType } from "nexus";
import * as crypto from "crypto";
import { Maybe } from "src/core/logic";
import { config } from "src/config";

export const Relationship = objectType({
    name: "Relationship",
    definition(t) {
        t.nonNull.string("fromUserId");
        t.nonNull.string("toUserId");
        t.nonNull.boolean("notifyOnBuy");
    },
});
