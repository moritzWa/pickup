import { enumType, list, nonNull, objectType } from "nexus";
import {
    TransactionType,
    TransferType,
} from "src/core/infra/postgres/entities";

export const WatchlistAsset = objectType({
    name: "WatchlistAsset",
    definition(t) {
        t.nonNull.string("userId");
        t.nonNull.string("provider");
        t.nonNull.string("contractAddress");
    },
});
