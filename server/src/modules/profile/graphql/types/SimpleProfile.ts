import { objectType } from "nexus";

export const SimpleProfile = objectType({
    name: "SimpleProfile",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("name");
        t.nonNull.string("username");
        t.nullable.string("avatarImageUrl");
    },
});
