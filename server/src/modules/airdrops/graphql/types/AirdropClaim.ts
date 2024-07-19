import { enumType, nonNull, nullable, objectType } from "nexus";
import { AirdropClaimStatus } from "src/core/infra/postgres/entities/Airdrop";

export const AirdropClaimStatusEnum = enumType({
    name: "AirdropClaimStatusEnum",
    members: AirdropClaimStatus,
});

export const AirdropClaim = objectType({
    name: "AirdropClaim",
    definition: (t) => {
        t.nonNull.id("id");
        t.nonNull.id("airdropId");
        t.field("status", { type: nonNull("AirdropClaimStatusEnum") });
        t.nonNull.string("code");
        t.field("airdrop", {
            type: nullable("Airdrop"),
        });
        t.nullable.string("inviterUsername");
        t.nullable.string("invitedUsername");
        t.nullable.string("transactionHash");
        t.nullable.boolean("isUserIn");
        t.nullable.float("userEarnAmount");
    },
});
