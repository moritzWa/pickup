import { idArg, list, nonNull, nullable, objectType, queryField } from "nexus";
import {
    Context,
    throwIfNotAuthenticated,
} from "src/core/surfaces/graphql/context";

export const LargestHolder = objectType({
    name: "LargestHolder",
    definition(t) {
        t.nullable.string("tokenAccountKey");
        t.nullable.string("accountKey");
        t.nullable.string("amount");
        t.nullable.float("percentage");
    },
});
