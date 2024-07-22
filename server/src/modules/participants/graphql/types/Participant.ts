import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";

export const Course = objectType({
    name: "Course",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("title");
        t.nonNull.string("subtitle");
        t.nonNull.string("imageUrl");
        t.nonNull.string("textColor");
        t.nonNull.string("backgroundColor");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
