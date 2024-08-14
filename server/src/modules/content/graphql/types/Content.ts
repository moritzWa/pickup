import { list, nonNull, nullable, objectType } from "nexus";
import { Author } from "src/modules/author/graphql";

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
        t.nullable.string("authorName", {
            resolve: (p) => (p.authors || [])[0]?.name,
        });
        t.nullable.string("authorImageUrl", {
            resolve: (p) => (p.authors || [])[0]?.imageUrl,
        });
        t.list.field("authors", {
            type: nonNull(Author),
        });
        t.nullable.string("thumbnailImageUrl");
        t.nullable.string("sourceImageUrl");
        t.nonNull.string("title");
        // categories list of string
        t.nonNull.list.nonNull.string("categories");
        t.nullable.string("summary");
        t.nonNull.int("lengthMs");
        t.nonNull.int("lengthSeconds", {
            resolve: (content) => Math.ceil(content.lengthMs / 1000),
        });
        t.nonNull.string("websiteUrl");
        t.nullable.field("contentSession", {
            type: nullable("ContentSession"),
        });
        t.field("followUpQuestions", {
            type: nonNull(list(nonNull("FollowUpQuestion"))),
        });
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
