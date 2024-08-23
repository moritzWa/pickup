import BigNumber from "bignumber.js";
import { nullable, objectType } from "nexus";

export const Notification = objectType({
    name: "Notification",
    definition: (t) => {
        t.nonNull.id("id");
        t.nullable.string("iconImageUrl");
        t.nonNull.string("title");
        t.nonNull.string("subtitle");
        t.nonNull.boolean("hasRead");
        t.nonNull.boolean("hasSent");
        t.nonNull.string("userId");
        t.nonNull.date("createdAt");
    },
});
