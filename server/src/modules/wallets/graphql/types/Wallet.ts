import { nonNull, objectType } from "nexus";

export const Wallet = objectType({
    name: "Wallet",
    definition(t) {
        t.nonNull.string("publicAddress");
        t.nonNull.string("provider");
        t.nonNull.boolean("isFunded");
    },
});
