import { list, nonNull, nullable, objectType } from "nexus";

export const Author = objectType({
    name: "Author",
    definition(t) {
        t.nonNull.string("id");
        t.nullable.string("name");
        t.nullable.string("imageUrl");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
