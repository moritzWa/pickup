import { nonNull, objectType } from "nexus";

export const GetMarketCapsAndVolumesResponse = objectType({
    name: "GetMarketCapsAndVolumesResponse",
    definition(t) {
        t.nonNull.string("contractAddress");
        t.nonNull.field("provider", { type: "AccountProviderEnum" });
        t.nullable.string("vol24h");
        t.nullable.string("marketCap");
    },
});
