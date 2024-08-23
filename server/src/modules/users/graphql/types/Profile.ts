import { objectType } from "nexus";

export const Profile = objectType({
    name: "Profile",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("username");
        t.nonNull.string("name");
        t.nonNull.string("description");
        t.nonNull.int("numFollowers");
        t.nonNull.int("numFollowing");
        t.nullable.string("avatarImageUrl");
        t.nonNull.boolean("isFollowing");
    },
});

export const PublicProfile = objectType({
    name: "PublicProfile",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("username");
        t.nonNull.string("name");
        t.nonNull.string("description");
        t.nullable.string("avatarImageUrl", {
            resolve: (t: any) => t.avatarImageUrl || t.imageUrl,
        });
    },
});
