import { nonNull, objectType } from "nexus";

export const FeedComment = objectType({
    name: "FeedComment",
    definition(t) {
        t.nonNull.id("id");
        t.nullable.id("feedPostId");
        t.nullable.id("feedCommentId");
        t.nonNull.id("userId");
        t.nonNull.string("content");
        t.nonNull.int("numLikes");
        t.nonNull.int("numComments");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
