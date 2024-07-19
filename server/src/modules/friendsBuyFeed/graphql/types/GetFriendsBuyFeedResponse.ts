import { nonNull, objectType } from "nexus";

export const GetFriendsBuyFeedResponse = objectType({
    name: "GetFriendsBuyFeedResponse",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.string("username");
        t.nonNull.string("name");
        t.nonNull.date("createdAt");
        t.nullable.string("iconImageUrl");
        t.nonNull.string("symbol");
        t.field("chain", { type: nonNull("AccountProviderEnum") });
        t.nonNull.string("contractAddress");
        t.nonNull.boolean("isYou");
    },
});
