import { nonNull, objectType } from "nexus";

export const FullFeedPost = objectType({
    name: "FullFeedPost",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.id("userId");
        t.nonNull.string("content");
        t.nonNull.field("profile", {
            type: nonNull("SimpleProfile"),
        });
        t.nonNull.int("numLikes");
        t.nonNull.int("numComments");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
