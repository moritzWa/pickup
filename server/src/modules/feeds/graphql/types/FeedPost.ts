import { nonNull, objectType } from "nexus";

export const FeedPost = objectType({
    name: "FeedPost",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.id("userId");
        t.nonNull.string("content");
        t.nonNull.int("numLikes");
        t.nonNull.int("numComments");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
