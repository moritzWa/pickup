import { enumType, nonNull, objectType } from "nexus";
import { WithdrawalStatus } from "src/core/infra/postgres/entities/Withdrawal";

export const WithdrawalStatusEnum = enumType({
    name: "WithdrawalStatusEnum",
    members: WithdrawalStatus,
});

export const Withdrawal = objectType({
    name: "Withdrawal",
    definition: (t) => {
        t.nonNull.id("id");
        t.nonNull.float("amount");
        t.nullable.string("kadoOrderId");
        t.nullable.string("trackingUrl", {
            resolve: (k) =>
                k.kadoOrderId
                    ? `https://app.kado.money/ramp/order/${k.kadoOrderId}`
                    : null,
        });
        t.nullable.string("hash");
        t.field("status", {
            type: nonNull("WithdrawalStatusEnum"),
        });
        t.nonNull.string("createdAt");
        t.nonNull.string("updatedAt");
    },
});
