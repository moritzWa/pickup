import { objectType } from "nexus";

export const GetProfileResponse = objectType({
    name: "GetProfileResponse",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("username");
        t.nonNull.string("name");
        t.nonNull.string("description");
        t.nonNull.int("numFollowers");
        t.nonNull.int("numFollowing");
        t.nullable.string("avatarImageUrl");
        t.nonNull.boolean("isFollowing");
        t.nullable.field("relationship", {
            type: "Relationship",
        });
    },
});
