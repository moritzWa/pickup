import { isNil } from "lodash";
import { objectType } from "nexus";
import BigNumber from "bignumber.js";

export const TokenChartPoint = objectType({
    name: "TokenChartPoint",
    definition(t) {
        t.nonNull.date("timestamp");
        t.nonNull.float("utcTimeSeconds");
        t.nullable.float("value", {
            resolve: (v: any) =>
                !isNil(v.value) ? new BigNumber(v.value).toNumber() : 0,
        });
        t.nullable.float("valueCents", {
            resolve: (v: any) =>
                !isNil(v.valueCents)
                    ? new BigNumber(v.valueCents).toNumber()
                    : 0,
        });
        t.nullable.float("open", {
            resolve: (v: any) =>
                !isNil(v.open) ? new BigNumber(v.open).toNumber() : 0,
        });
        t.nullable.float("close", {
            resolve: (v: any) =>
                !isNil(v.openCents) ? new BigNumber(v.openCents).toNumber() : 0,
        });
        t.nullable.float("high", {
            resolve: (v: any) =>
                !isNil(v.high) ? new BigNumber(v.high).toNumber() : 0,
        });
        t.nullable.float("low", {
            resolve: (v: any) =>
                !isNil(v.low) ? new BigNumber(v.low).toNumber() : 0,
        });
    },
});
