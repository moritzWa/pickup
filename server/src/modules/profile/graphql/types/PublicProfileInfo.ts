import { enumType, list, nonNull, nullable, objectType } from "nexus";

export const PublicProfileInfo = objectType({
    name: "PublicProfileInfo",
    definition(t) {
        t.nullable.string("avatarImageUrl");
        t.nonNull.string("username"); // username is public to everyone
        t.nonNull.string("name"); // name is public to everyone
        t.nullable.float("numberOfFollowers");
        t.nonNull.id("id");
    },
});
