import { objectType } from "nexus";

export const Referral = objectType({
    name: "Referral",
    definition: (t) => {
        t.nonNull.id("id");
    },
});
