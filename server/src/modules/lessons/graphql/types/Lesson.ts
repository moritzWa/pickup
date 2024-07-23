import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { LessonType } from "src/core/infra/postgres/entities/Lesson";

export const LessonTypeEnum = enumType({
    name: "LessonTypeEnum",
    members: LessonType,
});

export const LessonRole = objectType({
    name: "LessonRole",
    definition(t) {
        t.nonNull.string("type");
        t.nonNull.string("context");
    },
});

export const Lesson = objectType({
    name: "Lesson",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("title");
        t.nonNull.string("subtitle");
        t.nonNull.string("content");
        t.nonNull.field("roles", {
            type: nonNull(list(nonNull("LessonRole"))),
        });
        t.nonNull.string("courseId");
        t.nonNull.field("type", {
            type: nonNull("LessonTypeEnum"),
        });
        t.nullable.field("progress", {
            type: nullable("LessonProgress"),
        });
        t.nullable.field("sessions", {
            type: nullable(list(nonNull("LessonSession"))),
        });
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
