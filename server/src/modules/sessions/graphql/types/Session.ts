import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";

export const Session = objectType({
    name: "Session",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
