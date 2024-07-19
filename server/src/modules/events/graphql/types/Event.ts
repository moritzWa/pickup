import { objectType, nonNull, list } from "nexus";

export const Event = objectType({
    name: "Event",
    definition(t) {
        t.nonNull.id("id");
        t.nonNull.id("tokenId");
        t.nonNull.string("title");
        t.nonNull.string("link");
        t.nonNull.string("iconImageUrl", {
            resolve: (parent) =>
                "https://assets.movement.market/icons/twitter-blue-white.jpg",
        });
        t.nonNull.date("startTime");
        t.nonNull.date("createdAt");
        t.nonNull.date("updatedAt");
    },
});
