import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { LessonType } from "src/core/infra/postgres/entities/Lesson";

export const ContentSession = objectType({
    name: "ContentSession",
    definition(t) {
        t.nonNull.string("id");
        t.nullable.float("timestampCursor");
        t.nonNull.string("contentId");
        t.nonNull.string("userId");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
