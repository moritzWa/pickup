import { objectType } from "nexus";

export const Author = objectType({
    name: "Author",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("name");
        t.nullable.string("imageUrl");
        t.list.field("contents", {
            type: "Content",
        });
    },
});
