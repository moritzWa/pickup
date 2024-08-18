import { nonNull, nullable, objectType } from "nexus";
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
        t.nullable.string("context"); // not used
        t.nullable.string("audioUrl");
        t.nullable.string("authorName", {
            resolve: (p) => (p.authors || [])[0]?.name,
        });
        t.nullable.string("content");
        t.nullable.string("authorImageUrl", {
            resolve: (p) => (p.authors || [])[0]?.imageUrl,
        });
        t.list.field("authors", {
            type: nonNull(Author),
            resolve: (parent) => parent.authors || [],
        });
        t.nullable.string("thumbnailImageUrl");
        t.nullable.string("sourceImageUrl"); // not used
        t.nonNull.string("title");
        // categories list of string
        t.nonNull.list.nonNull.string("categories");
        t.nullable.string("summary");
        t.nullable.int("lengthMs");
        t.nonNull.int("lengthSeconds", {
            resolve: (content) => Math.ceil(content.lengthMs ?? 0 / 1000),
        });
        t.nullable.string("lengthFormatted", {
            resolve: (content) => {
                const lengthMs = content.lengthMs;

                if (lengthMs == null) return null;

                const totalSeconds = Math.floor(lengthMs / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const hours = Math.floor(minutes / 60);
                const seconds = totalSeconds % 60;

                if (hours > 0) {
                    return `${hours}h ${minutes % 60}m`;
                } else if (minutes > 0) {
                    return seconds > 0
                        ? `${minutes}m ${seconds}s`
                        : `${minutes}m`;
                } else {
                    return `${seconds}s`;
                }
            },
        });
        t.nonNull.string("websiteUrl");
        t.nullable.field("contentSession", {
            type: nullable("ContentSession"),
        });
        t.list.field("followUpQuestions", {
            type: nonNull(FollowUpQuestion),
            resolve: (parent) => parent.followUpQuestions || [],
        });
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
        t.nullable.field("contentSession", {
            type: nullable("ContentSession"),
        });
        t.list.field("followUpQuestions", {
            type: nonNull(FollowUpQuestion),
            resolve: (parent) => parent.followUpQuestions || [],
        });
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
