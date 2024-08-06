import { objectType } from "nexus";

export const MetadataType = objectType({
    name: "Metadata",
    definition(t) {
        t.string("full_text");
        t.string("author");
        t.string("page_type");
        t.int("length");
        t.string("excerpt");
        t.string("byline");
        t.string("dir");
        t.string("siteName");
        t.string("lang");
        t.string("publishedTime");
    },
});

export const SearchResult = objectType({
    name: "SearchResult",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("link");
        t.nonNull.string("title");
        t.string("fullText");
        t.string("snippet");
        t.field("metadata", { type: MetadataType }); // structured type
        t.nonNull.date("createdDate");
        t.nonNull.date("modifiedDate");
        t.date("lastCrawled");
        t.nonNull.list.nonNull.int("userIds");
        t.nonNull.int("readCount");
        t.nonNull.float("averageDistance");
        t.nonNull.float("minDistance");
    },
});
