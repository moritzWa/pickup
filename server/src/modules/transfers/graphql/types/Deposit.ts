import { objectType } from "nexus";

export const Deposit = objectType({
    name: "Deposit",
    definition: (t) => {
        t.nonNull.id("id");
        t.nonNull.float("amount");
        t.nullable.string("sourceType");
        t.nonNull.string("source");
        t.nonNull.string("createdAt");
        t.nonNull.string("updatedAt");
        t.nonNull.string("status");
        t.nonNull.boolean("hasSentFunds");
        t.nullable.string("transactionHash");
        t.nullable.string("paypalOrderId");
    },
});
