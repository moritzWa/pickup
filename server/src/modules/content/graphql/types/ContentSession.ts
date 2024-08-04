import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { LessonType } from "src/core/infra/postgres/entities/Lesson";

export const ContentSession = objectType({
    name: "ContentSession",
    definition(t) {
        t.nonNull.string("id");
        t.nullable.float("timestampCursor", {
            resolve: (session) => session.currentMs ?? 0,
        });
        t.nullable.float("currentMs", {
            resolve: (session) => session.currentMs ?? 0,
        });
        t.nullable.float("durationMs", {
            resolve: (session) => session.durationMs ?? 0,
        });
        t.nonNull.string("contentId");
        t.nonNull.string("userId");
        t.nullable.float("percentFinished");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
        t.field("content", {
            type: nullable("Content"),
        });
    },
});
