import { nonNull, objectType } from "nexus";

export const MemecoinLink = objectType({
    name: "MemecoinLink",
    definition(t) {
        t.nonNull.field("type", {
            type: nonNull("MemecoinLinkTypeEnum"),
        });
        t.nonNull.string("url");
        t.nullable.boolean("alwaysShow");
    },
});
