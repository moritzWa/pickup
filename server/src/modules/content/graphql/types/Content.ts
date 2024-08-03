import BigNumber from "bignumber.js";
import { enumType, list, nonNull, nullable, objectType } from "nexus";
import { LessonType } from "src/core/infra/postgres/entities/Lesson";

export const FollowUpQuestion = objectType({
    name: "FollowUpQuestion",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("question");
        t.nonNull.string("answer");
    },
});

export const Content = objectType({
    name: "Content",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("context");
        t.nonNull.string("audioUrl");
        t.nonNull.string("authorName");
        t.nullable.string("authorImageUrl");
        t.nullable.string("thumbnailImageUrl");
        t.nonNull.string("title");
        // categories list of string
        t.nonNull.list.nonNull.string("categories");
        t.nullable.string("summary");
        t.nonNull.int("lengthSeconds");
        t.nonNull.string("websiteUrl");
        t.field("followUpQuestions", {
            type: nonNull(list(nonNull("FollowUpQuestion"))),
        });
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
