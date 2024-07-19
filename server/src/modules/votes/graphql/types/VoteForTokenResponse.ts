import BigNumber from "bignumber.js";
import { objectType } from "nexus";

export const VoteForTokenResponse = objectType({
    name: "VoteForTokenResponse",
    definition: (t) => {
        t.nonNull.int("numVotes");
        t.nonNull.id("tokenId");
    },
});
