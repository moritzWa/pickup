import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";

export const Lesson = objectType({
    name: "Lesson",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
