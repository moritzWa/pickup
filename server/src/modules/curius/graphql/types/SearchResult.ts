import { objectType } from "nexus";

export const SearchResult = objectType({
    name: "SearchResult",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("link");
        t.nonNull.string("title");
        t.string("snippet");
        t.float("distance");
    },
});
