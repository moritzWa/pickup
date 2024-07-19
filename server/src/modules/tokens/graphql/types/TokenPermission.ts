import { nonNull, nullable, objectType } from "nexus";

export const TokenPermission = objectType({
    name: "TokenPermission",
    definition(t) {
        t.nonNull.id("id");
        t.nullable.id("userId");
        t.nonNull.id("tokenId");
        t.nonNull.string("claimCode");
        t.nonNull.date("createdAt");
        t.field("token", {
            type: nonNull("Token"),
            resolve: (p) => p.token,
        });
        t.field("user", {
            type: nullable("User"),
            resolve: (p) => p.user,
        });
    },
});
