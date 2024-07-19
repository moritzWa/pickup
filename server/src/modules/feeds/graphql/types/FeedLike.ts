import { nonNull, objectType } from "nexus";

export const FeedLike = objectType({
    name: "FeedLike",
    definition(t) {
        t.nonNull.id("id");
        t.nullable.id("feedPostId");
        t.nullable.id("feedCommentId");
        t.nonNull.id("userId");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
