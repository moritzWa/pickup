import { enumType, list, nonNull, objectType } from "nexus";
import {
    TransactionStatus,
    TransactionType,
    TransferType,
} from "src/core/infra/postgres/entities";

export const Transaction = objectType({
    name: "Transaction",
    definition(t) {
        t.nonNull.string("id");
        t.nonNull.string("hash");
        t.nullable.string("description");
        t.nonNull.field("type", { type: nonNull("TransactionTypeEnum") });
        t.nonNull.field("provider", { type: nonNull("AccountProviderEnum") });
        t.nonNull.string("blockExplorerUrl");
        t.field("transfers", { type: nonNull(list(nonNull("Transfer"))) });
        t.nonNull.float("feePaidAmount", {
            resolve: (t) => t.feePaidAmount.toNumber(),
        });
        t.nonNull.date("createdAt");
    },
});

export const Transfer = objectType({
    name: "Transfer",
    definition(t) {
        t.field("type", { type: nonNull("TransferTypeEnum") });
        t.nullable.string("from");
        t.nullable.string("to");
        t.nullable.string("symbol");
        t.nullable.string("iconImageUrl");
        t.nonNull.string("contractAddress", {
            resolve: (t) => t.tokenContractAddress || "",
        });
        t.nonNull.float("amount", {
            resolve: (t) => t.amount.toNumber(),
        });
    },
});

export const TransferTypeEnum = enumType({
    name: "TransferTypeEnum",
    members: TransferType,
});

export const TransactionTypeEnum = enumType({
    name: "TransactionTypeEnum",
    members: TransactionType,
});

export const TransactionStatusEnum = enumType({
    name: "TransactionStatusEnum",
    members: TransactionStatus,
});
