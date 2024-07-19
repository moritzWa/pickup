import { inputObjectType, nonNull, objectType } from "nexus";

export const TokenAddressAndProvider = inputObjectType({
    name: "TokenAddressAndProvider",
    definition(t) {
        t.nonNull.string("contractAddress");
        t.nonNull.field("provider", { type: "AccountProviderEnum" });
    },
});
