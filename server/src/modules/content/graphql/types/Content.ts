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

export const ContentUserFollowingProfile = objectType({
    name: "ContentUserFollowingProfile",
    definition: (t) => {
        t.nonNull.id("id");
        t.nullable.string("name");
        t.nullable.string("avatarImageUrl");
        t.nullable.string("username");
    },
});

export const Content = objectType({
    name: "Content",
    definition(t) {
        t.nonNull.string("id");
        t.nullable.string("context"); // not used
        t.nullable.string("content");
        t.nullable.string("audioUrl");
        t.nullable.string("websiteUrl");
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
        t.field("friends", {
            type: nullable(list(nonNull("ContentUserFollowingProfile"))),
        });
        t.nullable.string("thumbnailImageUrl");
        t.nullable.string("ogDescription");
        t.nullable.boolean("couldntFetchThumbnail");
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
                if (content.lengthMs != null) {
                    // Audio content
                    const totalSeconds = Math.floor(content.lengthMs / 1000);
                    const minutes = Math.floor(totalSeconds / 60);
                    const hours = Math.floor(minutes / 60);
                    const seconds = totalSeconds % 60;

                    if (hours > 0) {
                        return `${hours}h ${minutes % 60}m`;
                    } else if (minutes > 0) {
                        return `${minutes}m`;
                    } else {
                        return `${seconds}s`;
                    }
                } else if (content.length != null) {
                    // Text content
                    const wordsCount = Math.ceil(content.length / 5);
                    const readingTimeMinutes = Math.ceil(wordsCount / 200);

                    if (readingTimeMinutes < 1) {
                        return "< 1m";
                    } else if (readingTimeMinutes < 60) {
                        return `${readingTimeMinutes}m`;
                    } else {
                        const hours = Math.floor(readingTimeMinutes / 60);
                        const minutes = readingTimeMinutes % 60;
                        return minutes > 0
                            ? `${hours}h ${minutes}m`
                            : `${hours}h`;
                    }
                }

                return null;
            },
        });
        t.nullable.date("releasedAt");
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
